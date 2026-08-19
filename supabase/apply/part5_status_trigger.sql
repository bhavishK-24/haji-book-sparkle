-- ═════════════════════════════════════════════════════════════════════
-- PART 5 of 6 — status trigger
--
-- Run the parts IN ORDER, one at a time, in the Supabase SQL Editor.
-- Each part is its own transaction: if one fails, nothing in it applied,
-- and every part is safe to re-run.
-- ═════════════════════════════════════════════════════════════════════

BEGIN;

-- ── on a status change ──────────────────────────────────────────────────────
-- Fires only when `status` actually changed, so an unrelated UPDATE (adding a
-- price, correcting an address) never emails the customer.
CREATE OR REPLACE FUNCTION public.on_booking_status_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb := public.booking_notification_payload(NEW);
  event_name text;
  r record;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  event_name := CASE NEW.status
    WHEN 'confirmed' THEN 'booking_confirmed'
    WHEN 'cancelled' THEN 'booking_cancelled'
    WHEN 'completed' THEN 'booking_status_changed'
    ELSE NULL
  END;

  -- Moving a booking back to 'new' is an internal correction, not news.
  IF event_name IS NULL THEN
    RETURN NEW;
  END IF;

  payload := payload || jsonb_build_object('previousStatus', OLD.status);

  -- The customer, if we have an address for them.
  PERFORM public.enqueue_notification(
    NEW.id, event_name, 'customer', 'email', NEW.email, payload
  );

  -- The office, so a cancellation is visible without watching the dashboard.
  IF NEW.status = 'cancelled' THEN
    FOR r IN SELECT email FROM public.notification_recipients WHERE active LOOP
      PERFORM public.enqueue_notification(
        NEW.id, event_name, 'staff', 'email', r.email, payload
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_status_notify ON public.bookings;
CREATE TRIGGER bookings_status_notify
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.on_booking_status_changed();

COMMIT;
