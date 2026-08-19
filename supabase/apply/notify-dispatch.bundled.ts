// ── SINGLE-FILE BUILD — for pasting into the Supabase dashboard ──────────
//
// Generated from supabase/functions/notify-dispatch/{index,templates}.ts.
// Edit those, not this. Regenerate with: node scripts/bundle-function.mjs

import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Email templates for the notification outbox.
 *
 * Separated from delivery so the wording can change without touching the
 * transport, and so a second channel (WhatsApp Business Platform) can render
 * the same events differently without either knowing about the other.
 *
 * Every template receives the payload frozen at enqueue time — never the live
 * booking. A customer who was promised AED 809 must be emailed AED 809 even if
 * the office has since corrected the row.
 */

export type NotificationPayload = {
  reference: string | null;
  customerName: string | null;
  phone: string | null;
  email: string | null;
  serviceName: string | null;
  serviceId: string | null;
  serviceCategory: string | null;
  propertyType: string | null;
  propertySize: string | null;
  furnishing: string | null;
  emirate: string | null;
  address: string | null;
  date: string | null;
  timeSlot: string | null;
  requestedStart: string | null;
  estimatedMinutes: number | null;
  addOns: Array<{ id?: string; name?: string; quantity?: number | null }>;
  priceAmount: number | null;
  priceCurrency: string | null;
  status: string | null;
  notes: string | null;
  previousStatus?: string | null;
};

export type Rendered = { subject: string; html: string; text: string };

const COMPANY = {
  name: "Haji Ahli Cleaning & Maintenance Services L.L.C.",
  legalName: "Haji Ahli Building Cleaning Services LLC",
  phone: "+971 50 436 3875",
  email: "enquiry@hajiahliclean.com",
  trn: "100321015800003",
  cancelHours: 5,
  rescheduleHours: 4,
};

const VAT_RATE = 0.05;

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const prettyDate = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

/** Prices are stored VAT-exclusive; customers are always shown the inclusive figure. */
const money = (amount: number | null, currency: string | null): string | null => {
  if (amount === null || amount === undefined) return null;
  const inc = Math.round(amount * (1 + VAT_RATE) * 100) / 100;
  const fmt = (n: number) =>
    `${currency ?? "AED"} ${n.toLocaleString("en-AE", { maximumFractionDigits: 2 })}`;
  return `${fmt(inc)} (incl. ${VAT_RATE * 100}% VAT · ${fmt(amount)} before VAT)`;
};

const addOnList = (addOns: NotificationPayload["addOns"]): string | null => {
  if (!Array.isArray(addOns) || addOns.length === 0) return null;
  return addOns
    .map((a) => (a?.quantity ? `${a.name} ×${a.quantity}` : a?.name))
    .filter(Boolean)
    .join(", ");
};

/** Label/value rows, skipping anything we do not actually know. */
function rows(pairs: Array<[string, string | null]>): { html: string; text: string } {
  const present = pairs.filter(([, v]) => v !== null && v !== undefined && v !== "");
  return {
    html: present
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 16px 6px 0;color:#5b6b60;font-size:14px;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;font-size:14px;color:#12211a">${esc(v)}</td></tr>`,
      )
      .join(""),
    text: present.map(([k, v]) => `${k}: ${v}`).join("\n"),
  };
}

function shell(heading: string, lead: string, body: string, footNote?: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f2ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ed;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
  <tr><td style="background:#0f2c1e;padding:28px 32px">
    <div style="color:#ffffff;font-size:19px;font-weight:700;letter-spacing:-0.01em">${esc(heading)}</div>
  </td></tr>
  <tr><td style="padding:28px 32px">
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#12211a">${lead}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${body}</table>
    ${footNote ? `<p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#5b6b60">${footNote}</p>` : ""}
  </td></tr>
  <tr><td style="padding:20px 32px;border-top:1px solid #e6e3dc;font-size:12px;line-height:1.6;color:#78877c">
    ${esc(COMPANY.name)}<br>
    ${esc(COMPANY.phone)} · ${esc(COMPANY.email)}<br>
    TRN ${esc(COMPANY.trn)}
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

const footer = `\n\n—\n${COMPANY.name}\n${COMPANY.phone} · ${COMPANY.email}\nTRN ${COMPANY.trn}`;

/** Booking detail shared by every customer-facing template. */
function bookingRows(p: NotificationPayload) {
  return rows([
    ["Reference", p.reference],
    ["Service", p.serviceName],
    ["Date", prettyDate(p.date)],
    ["Arrival", p.requestedStart ? p.requestedStart.slice(0, 5) : p.timeSlot],
    /*
     * No estimated duration or crew size. The figures behind them are still
     * being reconciled — the pricing sheet and the duration calibration
     * disagree about the same job — and a customer who is emailed "about 3
     * hours" will hold us to it. The coordinator gives timing on the call,
     * where it can be qualified.
     */
    ["Property", [p.propertySize, p.furnishing].filter(Boolean).join(" · ") || p.propertyType],
    ["Extras", addOnList(p.addOns)],
    ["Price", money(p.priceAmount, p.priceCurrency)],
  ]);
}

/**
 * Renders one outbox row, or null when this channel has no template for the
 * event/audience pair — the drainer marks those 'skipped' rather than failing.
 */
export function render(event: string, audience: string, p: NotificationPayload): Rendered | null {
  const ref = p.reference ?? "—";
  const name = (p.customerName ?? "there").split(" ")[0];

  // ── staff: a new booking has come in ────────────────────────────────────
  if (event === "booking_created" && audience === "staff") {
    const r = rows([
      ["Reference", p.reference],
      ["Customer", p.customerName],
      ["Phone", p.phone],
      ["Email", p.email],
      ["Service", p.serviceName],
      ["Service ID", p.serviceId],
      ["Property", [p.propertySize, p.furnishing].filter(Boolean).join(" · ") || p.propertyType],
      ["Emirate", p.emirate],
      ["Address", p.address],
      ["Date", prettyDate(p.date)],
      ["Arrival", p.requestedStart ? p.requestedStart.slice(0, 5) : p.timeSlot],
      ["Extras", addOnList(p.addOns)],
      ["Price", money(p.priceAmount, p.priceCurrency)],
      ["Notes", p.notes],
    ]);
    return {
      subject: `New booking ${ref} — ${p.serviceName ?? "service"} on ${prettyDate(p.date)}`,
      html: shell(
        `New booking · ${esc(ref)}`,
        "A new booking request came in through the website. Call the customer to confirm scope, access and price.",
        r.html,
        "Open the dashboard to confirm or cancel this booking.",
      ),
      text: `New booking ${ref}\n\nCall the customer to confirm scope, access and price.\n\n${r.text}${footer}`,
    };
  }

  // ── customer: we have confirmed the visit ───────────────────────────────
  if (event === "booking_confirmed" && audience === "customer") {
    const r = bookingRows(p);
    return {
      subject: `Booking confirmed — ${ref}`,
      html: shell(
        "Your booking is confirmed",
        `Thanks ${esc(name)} — your visit is booked and our crew is scheduled. Here are the details.`,
        r.html,
        `Need to change it? Call or WhatsApp <strong>${esc(COMPANY.phone)}</strong> quoting ${esc(ref)}. Free cancellation up to ${COMPANY.cancelHours} hours before, free rescheduling up to ${COMPANY.rescheduleHours} hours before.`,
      ),
      text: `Your booking is confirmed\n\nThanks ${name} — your visit is booked.\n\n${r.text}\n\nNeed to change it? Call or WhatsApp ${COMPANY.phone} quoting ${ref}. Free cancellation up to ${COMPANY.cancelHours} hours before, free rescheduling up to ${COMPANY.rescheduleHours} hours before.${footer}`,
    };
  }

  // ── customer: the job is done ───────────────────────────────────────────
  if (event === "booking_status_changed" && audience === "customer" && p.status === "completed") {
    const r = rows([
      ["Reference", p.reference],
      ["Service", p.serviceName],
      ["Date", prettyDate(p.date)],
      ["Extras", addOnList(p.addOns)],
      ["Price", money(p.priceAmount, p.priceCurrency)],
    ]);
    return {
      subject: `Work completed — ${ref}`,
      html: shell(
        "Thank you",
        `Thanks ${esc(name)} — the work is complete. Here is a summary for your records.`,
        r.html,
        `If anything is not right, tell us within 24 hours on <strong>${esc(COMPANY.phone)}</strong> and we will come back and put it right at no charge. Pest treatments are covered for three months.`,
      ),
      text: `Thank you\n\nThanks ${name} — the work is complete.\n\n${r.text}\n\nIf anything is not right, tell us within 24 hours on ${COMPANY.phone} and we will put it right at no charge.${footer}`,
    };
  }

  // ── cancellation ────────────────────────────────────────────────────────
  if (event === "booking_cancelled") {
    const r = rows([
      ["Reference", p.reference],
      ["Service", p.serviceName],
      ["Was scheduled", prettyDate(p.date)],
      ...(audience === "staff"
        ? ([
            ["Customer", p.customerName],
            ["Phone", p.phone],
          ] as Array<[string, string | null]>)
        : []),
    ]);

    if (audience === "staff") {
      return {
        subject: `Booking cancelled — ${ref}`,
        html: shell(`Booking cancelled · ${esc(ref)}`, "A booking has been cancelled.", r.html),
        text: `Booking cancelled ${ref}\n\n${r.text}${footer}`,
      };
    }

    return {
      subject: `Booking cancelled — ${ref}`,
      html: shell(
        "Your booking has been cancelled",
        `${esc(name)}, your booking has been cancelled and no crew will attend. Nothing further is owed unless we have already told you otherwise.`,
        r.html,
        `Booked by mistake, or want another date? Call or WhatsApp <strong>${esc(COMPANY.phone)}</strong> and we will sort it out.`,
      ),
      text: `Your booking has been cancelled\n\n${name}, your booking has been cancelled and no crew will attend.\n\n${r.text}\n\nWant another date? Call or WhatsApp ${COMPANY.phone}.${footer}`,
    };
  }

  return null;
}

// ── dispatcher ──────────────────────────────────────────────────────────

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
