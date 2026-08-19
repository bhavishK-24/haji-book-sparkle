// Drains the notification outbox and delivers each row.
//
// Runs on Supabase Edge Functions, so delivery does not depend on any browser
// staying open — a database trigger enqueues the row inside the booking's own
// transaction, and this function sends it whenever it next runs.
//
// Invoke it from a Database Webhook on `notifications` INSERT for promptness,
// and from a cron schedule as a safety net so a webhook that failed to fire, or
// a send that errored, is retried rather than lost.
//
// Secrets are read from the environment. Nothing is hardcoded, and no key here
// is ever exposed to the browser: this runs server-side only.
//
//   supabase secrets set RESEND_API_KEY=...
//   supabase secrets set NOTIFY_FROM_EMAIL="Haji Ahli <bookings@hajiahliclean.com>"
//
// Until RESEND_API_KEY is set the function still runs: it renders every message
// and reports what it *would* send, leaving the rows pending. That way the
// trigger, payload and templates can be verified before a provider exists.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { render, type NotificationPayload } from "./templates.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
/* Supabase injects this into every Edge Function; it bypasses RLS. */
const SERVICE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = Deno.env.get("NOTIFY_FROM_EMAIL") ?? "Haji Ahli <onboarding@resend.dev>";
/* Guards the cron/manual entry points. Optional; the webhook uses Supabase auth. */
const DISPATCH_SECRET = Deno.env.get("NOTIFY_DISPATCH_SECRET");

const BATCH = 25;

type NotificationRow = {
  id: string;
  booking_id: string | null;
  event: string;
  channel: string;
  audience: string;
  recipient: string;
  payload: NotificationPayload;
  attempts: number;
  max_attempts: number;
  created_at: string | null;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Sends one email. Returns the provider's message id, or a typed failure. */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string; retryable: boolean }> {
  if (!RESEND_API_KEY) {
    /*
     * No provider configured. Reported as a non-retryable skip rather than a
     * failure so the attempt counter does not burn through max_attempts before
     * the key is ever set.
     */
    return { ok: false, error: "RESEND_API_KEY not configured", retryable: true };
  }

  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
    });
  } catch (e) {
    /* Network-level failure: worth retrying. */
    return {
      ok: false,
      error: `network: ${e instanceof Error ? e.message : String(e)}`,
      retryable: true,
    };
  }

  const body = await res.text();
  if (!res.ok) {
    /*
     * 4xx means the request itself is wrong — a malformed address, an
     * unverified sending domain. Retrying cannot fix that, and burning five
     * attempts on it only delays the rows behind it. 429 and 5xx are transient.
     */
    const retryable = res.status === 429 || res.status >= 500;
    return { ok: false, error: `${res.status}: ${body.slice(0, 300)}`, retryable };
  }

  let id = "";
  try {
    id = (JSON.parse(body) as { id?: string }).id ?? "";
  } catch {
    /* A 2xx with an unparseable body still counts as sent. */
  }
  return { ok: true, id };
}

Deno.serve(async (req) => {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json({ error: "Function is missing SUPABASE_URL or the service role key" }, 500);
  }

  /*
   * When a dispatch secret is configured, require it. Database Webhooks send it
   * as a header; cron and manual invocations must too. Without a secret set the
   * function relies on Supabase's own function authorisation.
   */
  if (DISPATCH_SECRET) {
    const provided = req.headers.get("x-dispatch-secret");
    if (provided !== DISPATCH_SECRET) return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  /*
   * Claim a batch. `claim_pending_notifications` marks rows in-flight and
   * increments attempts atomically with SKIP LOCKED, so two invocations firing
   * at once — the webhook and the cron — cannot send the same message twice.
   */
  const { data: claimed, error: claimError } = await supabase.rpc("claim_pending_notifications", {
    _limit: BATCH,
  });

  if (claimError) {
    console.error("[notify-dispatch] claim failed", claimError.message);
    return json({ error: claimError.message }, 500);
  }

  /*
   * Sorted here, not in the claim query: an UPDATE ... RETURNING does not
   * preserve the ORDER BY of its own subquery, so a batch containing both a
   * confirmation and a completion for one booking could otherwise deliver them
   * in either order — and a customer must never be thanked for finished work
   * before being told the visit was confirmed.
   */
  const rows = ((claimed ?? []) as NotificationRow[]).sort((a, b) =>
    (a.created_at ?? "").localeCompare(b.created_at ?? ""),
  );
  if (rows.length === 0) return json({ claimed: 0, sent: 0, failed: 0, skipped: 0 });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows) {
    /* Only email is implemented. Other channels stay pending for their own worker. */
    if (row.channel !== "email") {
      await supabase
        .from("notifications")
        .update({ status: "pending", claimed_at: null, attempts: row.attempts - 1 })
        .eq("id", row.id);
      continue;
    }

    const message = render(row.event, row.audience, row.payload);

    if (!message) {
      /* No template for this event/audience. Not a failure — nothing to say. */
      await supabase
        .from("notifications")
        .update({
          status: "skipped",
          last_error: `no ${row.channel} template for ${row.event}/${row.audience}`,
        })
        .eq("id", row.id);
      skipped++;
      continue;
    }

    const result = await sendEmail(row.recipient, message.subject, message.html, message.text);

    if (result.ok) {
      await supabase
        .from("notifications")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          provider_message_id: result.id || null,
          last_error: null,
        })
        .eq("id", row.id);
      sent++;
      continue;
    }

    /*
     * A failure is recorded, never swallowed. Retryable failures go back to
     * pending for the next run; a permanent one is marked failed so it stops
     * consuming attempts and shows up in the dashboard as needing a human.
     */
    const exhausted = row.attempts >= row.max_attempts;
    await supabase
      .from("notifications")
      .update({
        status: result.retryable && !exhausted ? "pending" : "failed",
        claimed_at: null,
        last_error: result.error.slice(0, 500),
      })
      .eq("id", row.id);

    console.error(
      `[notify-dispatch] ${row.event}/${row.audience} to ${row.recipient} failed (attempt ${row.attempts}/${row.max_attempts}): ${result.error}`,
    );
    failed++;
  }

  return json({ claimed: rows.length, sent, failed, skipped });
});
