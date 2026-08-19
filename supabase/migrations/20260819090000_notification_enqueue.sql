-- Notification enqueueing, done in the database.
--
-- Why a trigger rather than application code: a notification must not depend on
-- the browser that caused it staying open, nor on the server function that wrote
-- the booking completing its own follow-up work. Enqueueing inside the same
-- transaction as the booking write means the outbox row and the booking either
-- both exist or neither does.
--
-- Delivery is a separate concern. This migration only ever writes 'pending'
-- rows; an Edge Function drains them. Nothing here talks to an email provider.

-- ── idempotency ─────────────────────────────────────────────────────────────
-- One notification per (booking, event, audience, channel). Without this, two
-- admins clicking "confirm" at the same moment, a double-submit, or a retried
-- webhook all send the customer a second confirmation email.
--
-- Deliberately a UNIQUE INDEX rather than a constraint so the enqueue helper
-- can use ON CONFLICT DO NOTHING against it.
CREATE UNIQUE INDEX IF NOT EXISTS notifications_once_per_event_idx
  ON public.notifications (booking_id, event, audience, channel);

-- ── enqueue helper ──────────────────────────────────────────────────────────
-- SECURITY DEFINER because the trigger runs as whoever wrote the booking, and
-- that role has no rights on `notifications` — only the service role does.
-- search_path is pinned so a caller cannot shadow `public` with their own table.
CREATE OR REPLACE FUNCTION public.enqueue_notification(
  _booking_id uuid,
  _event text,
  _audience text,
  _channel text,
  _recipient text,
  _payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- A missing recipient is not an error: a customer who gave no email address
  -- simply has no email notification. Enqueueing a row with a null recipient
  -- would fail the NOT NULL and roll back the booking with it.
  IF _recipient IS NULL OR btrim(_recipient) = '' THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (booking_id, event, channel, audience, recipient, payload)
  VALUES (_booking_id, _event, _channel, _audience, btrim(_recipient), COALESCE(_payload, '{}'::jsonb))
  ON CONFLICT (booking_id, event, audience, channel) DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enqueue_notification(uuid, text, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;

-- ── where internal mail goes ────────────────────────────────────────────────
-- A table rather than a hardcoded address so the office can change who gets
-- new-booking alerts without a deploy. Seeded with the company enquiry inbox.
CREATE TABLE IF NOT EXISTS public.notification_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  label text,
  -- Set false to stop alerts without losing the address.
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;

-- Dropped first so this whole migration can be safely re-run. CREATE POLICY has
-- no IF NOT EXISTS, and a half-applied run that has to be retried should not
-- fail on the one statement that already succeeded.
DROP POLICY IF EXISTS "Admins can read notification recipients"
  ON public.notification_recipients;
CREATE POLICY "Admins can read notification recipients"
  ON public.notification_recipients FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.notification_recipients (email, label)
VALUES ('enquiry@hajiahliclean.com', 'Office enquiries inbox')
ON CONFLICT (email) DO NOTHING;

-- ── the payload a channel worker needs ──────────────────────────────────────
-- Denormalised at enqueue time on purpose. A worker draining the outbox in an
-- hour's time must render the message the customer was promised, not whatever
-- the booking says by then.
CREATE OR REPLACE FUNCTION public.booking_notification_payload(_b public.bookings)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'reference',        _b.reference,
    'customerName',     _b.customer_name,
    'phone',            _b.phone,
    'email',            _b.email,
    'serviceName',      _b.service,
    'serviceId',        _b.service_id,
    'serviceCategory',  _b.service_category,
    'propertyType',     _b.property_type,
    'propertySize',     _b.property_size,
    'furnishing',       _b.furnishing,
    'emirate',          _b.emirate,
    'address',          _b.address,
    'date',             _b.booking_date,
    'timeSlot',         _b.time_slot,
    'requestedStart',   _b.requested_start,
    'estimatedMinutes', _b.estimated_minutes,
    'addOns',           COALESCE(_b.add_ons, '[]'::jsonb),
    'priceAmount',      _b.price_amount,
    'priceCurrency',    _b.price_currency,
    'status',           _b.status,
    'notes',            _b.notes
  );
$$;

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

-- ── retry bookkeeping ───────────────────────────────────────────────────────
-- Lets the drainer claim rows without two invocations racing for the same one,
-- and gives up after a fixed number of attempts rather than looping forever.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 5;

-- Claims up to _limit pending rows and marks them in-flight, atomically.
CREATE OR REPLACE FUNCTION public.claim_pending_notifications(_limit integer DEFAULT 25)
RETURNS SETOF public.notifications
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.notifications AS n
     SET claimed_at = now(),
         attempts = n.attempts + 1
   WHERE n.id IN (
     SELECT id FROM public.notifications
      WHERE status = 'pending'
        AND attempts < max_attempts
        -- Not already claimed in the last five minutes by another invocation.
        AND (claimed_at IS NULL OR claimed_at < now() - interval '5 minutes')
      ORDER BY created_at
      LIMIT _limit
      FOR UPDATE SKIP LOCKED
   )
  RETURNING n.*;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_pending_notifications(integer)
  FROM PUBLIC, anon, authenticated;
