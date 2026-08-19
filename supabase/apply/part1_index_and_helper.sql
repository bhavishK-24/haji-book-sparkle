-- ═════════════════════════════════════════════════════════════════════
-- PART 1 of 6 — index and helper
--
-- Run the parts IN ORDER, one at a time, in the Supabase SQL Editor.
-- Each part is its own transaction: if one fails, nothing in it applied,
-- and every part is safe to re-run.
-- ═════════════════════════════════════════════════════════════════════

BEGIN;

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

COMMIT;
