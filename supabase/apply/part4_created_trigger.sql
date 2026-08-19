-- ═════════════════════════════════════════════════════════════════════
-- PART 4 of 6 — created trigger
--
-- Run the parts IN ORDER, one at a time, in the Supabase SQL Editor.
-- Each part is its own transaction: if one fails, nothing in it applied,
-- and every part is safe to re-run.
-- ═════════════════════════════════════════════════════════════════════

BEGIN;

-- ── on a new booking ────────────────────────────────────────────────────────
-- Staff only. The customer is deliberately NOT emailed here: the office
-- confirms scope, access and price by phone first, and a "booking confirmed"
-- email before that call would promise something not yet agreed.
CREATE OR REPLACE FUNCTION public.on_booking_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb := public.booking_notification_payload(NEW);
  r record;
BEGIN
  FOR r IN SELECT email FROM public.notification_recipients WHERE active LOOP
    PERFORM public.enqueue_notification(
      NEW.id, 'booking_created', 'staff', 'email', r.email, payload
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_created_notify ON public.bookings;
CREATE TRIGGER bookings_created_notify
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.on_booking_created();

COMMIT;
