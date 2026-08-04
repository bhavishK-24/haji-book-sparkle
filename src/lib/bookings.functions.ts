import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const bookingSchema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  service: z.string().trim().min(2).max(120),
  property_type: z.string().trim().max(60).optional().or(z.literal("")),
  emirate: z.string().trim().min(2).max(60),
  address: z.string().trim().max(400).optional().or(z.literal("")),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_slot: z.string().trim().min(3).max(40),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bookingSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        customer_name: data.customer_name,
        phone: data.phone,
        email: data.email || null,
        service: data.service,
        property_type: data.property_type || null,
        emirate: data.emirate,
        address: data.address || null,
        booking_date: data.booking_date,
        time_slot: data.time_slot,
        notes: data.notes || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[bookings] insert failed", error.message);
      throw new Error("We could not save your booking. Please call us instead.");
    }
    return { id: row.id };
  });

export const listBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select("*")
      .order("booking_date", { ascending: true })
      .order("time_slot", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

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
    const { error } = await context.supabase
      .from("bookings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
