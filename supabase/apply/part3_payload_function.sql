-- ═════════════════════════════════════════════════════════════════════
-- PART 3 of 6 — payload function
--
-- Run the parts IN ORDER, one at a time, in the Supabase SQL Editor.
-- Each part is its own transaction: if one fails, nothing in it applied,
-- and every part is safe to re-run.
-- ═════════════════════════════════════════════════════════════════════

BEGIN;

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

COMMIT;
