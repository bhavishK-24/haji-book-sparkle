import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { SERVICES, getService, isOnlineBookable } from "@/data";

/**
 * Services the site may accept a self-booking for, by id.
 *
 * Derived from the catalogue rather than a hand-kept name list. The previous
 * check validated against the old Lovable service names, so every booking made
 * through the current flow was rejected with "please request a quote instead" —
 * the names no longer matched anything.
 */
const BOOKABLE_IDS = new Set(SERVICES.filter(isOnlineBookable).map((s) => s.id));

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

const bookingSchema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  /**
   * Required.
   *
   * Every booking sends the customer a confirmation carrying their reference,
   * price and arrival window. Without an address that message has nowhere to
   * go and the customer holds no written record of what they agreed to, so the
   * address is collected up front rather than chased afterwards.
   *
   * Enforced here as well as in the form: the `required` attribute is a
   * courtesy to the browser, not a guarantee.
   */
  email: z
    .string()
    .trim()
    .email({ message: "Enter an email address we can send your confirmation to." })
    .max(255),

  /** Catalogue id, e.g. "SVC-102". Authoritative. */
  service_id: z
    .string()
    .trim()
    .refine((v) => BOOKABLE_IDS.has(v), {
      message: "This service is arranged by our team — please request a quote instead.",
    }),
  /** Display name, kept for the existing free-text column and the admin list. */
  service: z.string().trim().min(2).max(120),

  property_type: optionalText(60),
  property_size: optionalText(60),
  furnishing: optionalText(30),
  emirate: z.string().trim().min(2).max(60),
  address: optionalText(400),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_slot: z.string().trim().min(3).max(40),
  notes: optionalText(1000),

  /** Structured add-ons: [{ id, name, quantity }]. */
  price_amount: z.number().nonnegative().nullable().optional(),
  add_ons: z
    .array(
      z.object({
        id: z.string().trim().max(20),
        name: z.string().trim().max(120),
        quantity: z.number().int().positive().nullable().optional(),
      }),
    )
    .max(20)
    .optional(),
});

/** Columns that only exist once the structured-bookings migration is applied. */
const STRUCTURED_COLUMNS = [
  "service_id",
  "service_category",
  "property_size",
  "furnishing",
  "add_ons",
  "price_amount",
  "requested_start",
  "source",
  "preferred_channel",
] as const;

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bookingSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const service = getService(data.service_id);

    /** Columns that have always existed. */
    const core = {
      customer_name: data.customer_name,
      phone: data.phone,
      email: data.email,
      service: data.service,
      property_type: data.property_type || null,
      emirate: data.emirate,
      address: data.address || null,
      booking_date: data.booking_date,
      time_slot: data.time_slot,
      notes: data.notes || null,
    };

    /** Added by the structured-bookings migration. */
    const structured = {
      service_id: data.service_id,
      service_category: service?.category ?? null,
      property_size: data.property_size || null,
      furnishing: data.furnishing || null,
      add_ons: data.add_ons ?? [],
      price_amount: data.price_amount ?? null,
      // Only store a start time when the customer picked a clock time; the
      // coarse preferences ("Morning") are not times and belong in time_slot.
      requested_start: /^\d{2}:\d{2}$/.test(data.time_slot) ? data.time_slot : null,
      source: "web",
      preferred_channel: "phone",
    };

    let row: { id: string; reference?: string | null } | null = null;
    let insertError: { message: string } | null = null;

    {
      const res = await supabaseAdmin
        .from("bookings")
        .insert({ ...core, ...structured })
        .select("id, reference")
        .single();
      row = res.data;
      insertError = res.error;
    }

    /*
     * If the migration has not been applied yet the structured columns do not
     * exist and PostgREST rejects the whole insert. Retry with the core
     * columns so a pending migration can never cost a real booking — the
     * structured data is still captured in `notes` by the caller.
     */
    if (insertError && STRUCTURED_COLUMNS.some((c) => insertError!.message.includes(c))) {
      console.warn(
        "[bookings] structured columns missing — apply the structured-bookings migration. Falling back.",
      );
      const res = await supabaseAdmin.from("bookings").insert(core).select("id").single();
      row = res.data;
      insertError = res.error;
    }

    if (insertError || !row) {
      console.error("[bookings] insert failed", insertError?.message);
      throw new Error("We could not save your booking. Please call us instead.");
    }
    /*
     * Prefer the reference the DATABASE generated.
     *
     * The table generates its own on insert, and `bookingReference` derives a
     * different one from the row id. Returning the derived value meant the
     * customer was told HA-9H9MSE while the row said HA-MX69B7 — the office
     * would search for a reference that does not exist. The derived value is
     * kept only as a fallback for the pre-migration path, where the column is
     * absent.
     */
    return { id: row.id, reference: row.reference ?? bookingReference(row.id) };
  });

/**
 * Customer-facing booking reference, derived from the row's UUID.
 *
 * Derived rather than read from the `reference` column so this works whether
 * or not the structured-bookings migration has been applied — a booking must
 * never fail because a schema change is pending. It is deterministic, so the
 * same booking always yields the same reference, and it uses an alphabet with
 * no 0/O/1/I because customers read these out over the phone.
 */
export function bookingReference(id: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const hex = id.replace(/-/g, "");
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[parseInt(hex.slice(i * 2, i * 2 + 2), 16) % alphabet.length];
  }
  return `HA-${out}`;
}

/**
 * The roles that may see and act on bookings.
 *
 * Checked explicitly, in addition to RLS. RLS alone returns an EMPTY LIST to a
 * signed-in user with no role, which the dashboard cannot tell apart from "no
 * bookings yet" — so a colleague waiting on their access saw a cheerful empty
 * state instead of being told to ask for a role.
 */
const STAFF_ROLES = ["admin", "staff"] as const;

type StaffContext = { supabase: SupabaseClient<Database>; userId: string };

async function assertStaff(context: StaffContext): Promise<void> {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);

  if (error) throw new Error("We could not verify your access. Please sign in again.");
  const roles = (data ?? []).map((r) => r.role as string);
  if (!roles.some((r) => (STAFF_ROLES as readonly string[]).includes(r))) {
    throw new Error(
      "Your account is signed in but has not been given dashboard access yet. Ask an administrator to grant you the admin or staff role.",
    );
  }
}

export const listBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as unknown as StaffContext);

    const { data, error } = await context.supabase
      .from("bookings")
      .select("*")
      /* Newest requests first: the dashboard is a work queue, not a diary. */
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/**
 * Delivery state of the notifications for the bookings on screen.
 *
 * Surfaced in the dashboard because a confirmation that silently failed to send
 * is worse than one that was never triggered — the office believes the customer
 * has been told.
 */
export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as unknown as StaffContext);

    const { data, error } = await context.supabase
      .from("notifications")
      .select("id, booking_id, event, audience, channel, status, last_error, sent_at, attempts")
      .order("created_at", { ascending: false })
      .limit(500);
    /*
     * Only admins can read the outbox, so a staff user gets a permission error
     * here. That is not worth failing the whole dashboard over.
     */
    if (error) return [];
    return data ?? [];
  });

export type BookingStatus = "new" | "confirmed" | "completed" | "cancelled";

/**
 * Which status changes are allowed, and from where.
 *
 * Enforced on the server, not just in the buttons. Each transition sends a
 * customer email via the database trigger, so an unintended one is not a
 * cosmetic mistake — completing a booking that was never confirmed would thank
 * a customer for work nobody scheduled.
 *
 * Terminal states stay terminal: reopening a cancelled booking means creating a
 * new one, which is also the honest record of what happened.
 */
export const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const updateBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "confirmed", "completed", "cancelled"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as unknown as StaffContext);

    /* Read the current status so the transition can be checked server-side. */
    const current = await context.supabase
      .from("bookings")
      .select("status")
      .eq("id", data.id)
      .single();

    if (current.error || !current.data) throw new Error("That booking could not be found.");

    const from = current.data.status as BookingStatus;
    if (from === data.status) return { ok: true, unchanged: true };

    if (!STATUS_TRANSITIONS[from].includes(data.status)) {
      throw new Error(`A ${from} booking cannot be moved to ${data.status}.`);
    }

    /*
     * Guarded by the status we just read. If another admin changed it in the
     * meantime the update matches nothing and we say so, rather than firing a
     * second notification for a transition that already happened.
     */
    const { data: updated, error } = await context.supabase
      .from("bookings")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("status", from)
      .select("id, status");

    if (error) throw new Error(error.message);
    if (!updated || updated.length === 0) {
      throw new Error("Someone else just changed this booking. Refresh to see the current status.");
    }

    return { ok: true, unchanged: false };
  });
