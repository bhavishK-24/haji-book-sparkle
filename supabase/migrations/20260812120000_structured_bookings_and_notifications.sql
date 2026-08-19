-- Structured booking data + a channel-agnostic notification outbox.
--
-- Motivation: the original `bookings` table stores the service as free text
-- and has nowhere to put the package, add-ons, duration or price. A future
-- WhatsApp Business Platform integration needs to read and write the same
-- booking records the website does, so the data has to be structured and the
-- delivery mechanism has to be separate from the booking itself.
--
-- Nothing here is WhatsApp-specific. `notifications` is an outbox that any
-- channel worker can drain; WhatsApp is simply one value of `channel`.

-- ── booking reference ───────────────────────────────────────────────────────
-- Short, human-quotable identifier. A customer reading it over the phone
-- should not have to spell a UUID, so it is HA-<6 alphanumerics>, generated
-- from an alphabet with no 0/O/1/I to avoid transcription errors.
CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
  END LOOP;
  RETURN 'HA-' || result;
END;
$$;

ALTER TABLE public.bookings
  -- Customer-facing reference. Unique so it can be looked up directly.
  ADD COLUMN IF NOT EXISTS reference text UNIQUE DEFAULT public.generate_booking_reference(),

  -- Catalogue linkage. Text rather than FK because the catalogue lives in the
  -- repo (generated from the workbook), not in the database.
  ADD COLUMN IF NOT EXISTS service_id text,
  ADD COLUMN IF NOT EXISTS service_category text,
  ADD COLUMN IF NOT EXISTS variant_id text,

  -- What the customer chose about their property, which is what drives both
  -- price and duration for the whole-home packages.
  ADD COLUMN IF NOT EXISTS property_size text,
  ADD COLUMN IF NOT EXISTS furnishing text,

  -- Add-ons as structured JSON: [{ id, name, quantity }]. JSONB so a channel
  -- worker can query it without parsing the notes field.
  ADD COLUMN IF NOT EXISTS add_ons jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Scheduling. `requested_start` is what the customer asked for;
  -- `estimated_minutes` is filled once duration metrics exist, and
  -- `scheduled_end` is derived from the two at confirmation time.
  ADD COLUMN IF NOT EXISTS requested_start time,
  ADD COLUMN IF NOT EXISTS estimated_minutes integer,
  ADD COLUMN IF NOT EXISTS scheduled_end timestamptz,

  -- Commercial fields. Null until pricing is finalised; payment is not wired
  -- up yet, but the columns exist so adding it is not a schema migration on
  -- live booking data.
  ADD COLUMN IF NOT EXISTS price_amount numeric(10, 2),
  ADD COLUMN IF NOT EXISTS price_currency text NOT NULL DEFAULT 'AED',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'not_required',

  -- Where the booking came from, so WhatsApp-originated bookings are
  -- distinguishable from web ones in the same table.
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'web',
  -- Preferred channel for replies to this customer.
  ADD COLUMN IF NOT EXISTS preferred_channel text NOT NULL DEFAULT 'phone';

-- Backfill references for any rows created before this migration.
UPDATE public.bookings
   SET reference = public.generate_booking_reference()
 WHERE reference IS NULL;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('not_required', 'pending', 'paid', 'refunded', 'failed'));

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_source_check
  CHECK (source IN ('web', 'whatsapp', 'phone', 'admin'));

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_preferred_channel_check
  CHECK (preferred_channel IN ('phone', 'whatsapp', 'email'));

CREATE INDEX IF NOT EXISTS bookings_reference_idx ON public.bookings (reference);
CREATE INDEX IF NOT EXISTS bookings_service_id_idx ON public.bookings (service_id);
CREATE INDEX IF NOT EXISTS bookings_date_status_idx ON public.bookings (booking_date, status);

-- ── notification outbox ─────────────────────────────────────────────────────
-- Channel-agnostic. A worker for any channel selects its own pending rows,
-- delivers them, and records the outcome. The booking engine only ever
-- enqueues; it never knows how a message is sent.
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings (id) ON DELETE CASCADE,

  -- What happened, not how to say it. Templates live with the channel worker.
  event text NOT NULL CHECK (
    event IN (
      'booking_created',
      'booking_confirmed',
      'booking_status_changed',
      'booking_cancelled',
      'enquiry_received'
    )
  ),
  channel text NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms', 'internal')),
  -- 'customer' or 'staff' — the same event goes to both, worded differently.
  audience text NOT NULL DEFAULT 'customer' CHECK (audience IN ('customer', 'staff')),

  -- Denormalised so a delivery worker needs no join and a later change of
  -- customer phone number does not rewrite delivery history.
  recipient text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  -- Provider message id, for delivery-receipt reconciliation later.
  provider_message_id text,

  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS notifications_pending_idx
  ON public.notifications (channel, status, created_at)
  WHERE status = 'pending';

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Only admins may read the outbox; it contains customer contact details.
CREATE POLICY "Admins can read notifications"
  ON public.notifications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Rows are written by trusted server code (service role), which bypasses RLS.
-- No anon insert policy: a public client must never enqueue a message.
