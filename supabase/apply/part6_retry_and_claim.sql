-- ═════════════════════════════════════════════════════════════════════
-- PART 6 of 6 — retry and claim
--
-- Run the parts IN ORDER, one at a time, in the Supabase SQL Editor.
-- Each part is its own transaction: if one fails, nothing in it applied,
-- and every part is safe to re-run.
-- ═════════════════════════════════════════════════════════════════════

BEGIN;

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

-- Record the migration as applied so a future `supabase db push` skips it.
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20260819090000')
ON CONFLICT (version) DO NOTHING;

COMMIT;
