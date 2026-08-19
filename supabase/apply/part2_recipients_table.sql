-- ═════════════════════════════════════════════════════════════════════
-- PART 2 of 6 — recipients table
--
-- Run the parts IN ORDER, one at a time, in the Supabase SQL Editor.
-- Each part is its own transaction: if one fails, nothing in it applied,
-- and every part is safe to re-run.
-- ═════════════════════════════════════════════════════════════════════

BEGIN;

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

COMMIT;
