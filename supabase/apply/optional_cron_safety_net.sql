-- ═════════════════════════════════════════════════════════════════════
-- CRON SAFETY NET for the notification outbox.
--
-- This does NOT create a second notification system. It calls the same
-- notify-dispatch Edge Function the Database Webhook already calls, with the
-- same secret, draining the same queue through the same claim function.
--
-- The webhook is the primary trigger and stays exactly as it is. This is the
-- belt to those braces: every five minutes it re-runs the drainer so a webhook
-- that never fired, or a send that failed transiently, is retried instead of
-- sitting pending forever.
--
-- Safe to run more than once: the schedule is removed and recreated by name.
--
-- BEFORE RUNNING:
--   1. Enable `pg_cron` and `pg_net` in Database → Extensions (see below).
--   2. Replace the two REPLACE_ placeholders.
-- ═════════════════════════════════════════════════════════════════════

-- ── preconditions ───────────────────────────────────────────────────────────
-- Both extensions install into their OWN schemas (`cron` and `net`), which they
-- pin in their control files — `CREATE EXTENSION ... WITH SCHEMA extensions`
-- fails outright. Enable them from Database → Extensions in the dashboard,
-- which puts each in the right place, then run this file.
--
-- This block fails early with a readable message rather than letting the
-- schedule statement below die with something cryptic.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE EXCEPTION 'pg_cron is not enabled. Enable it in Database → Extensions, then re-run this file.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE EXCEPTION 'pg_net is not enabled. Enable it in Database → Extensions, then re-run this file.';
  END IF;
END;
$$;

-- ── the schedule ────────────────────────────────────────────────────────────
-- Unscheduled first so re-running this file replaces the job rather than
-- erroring or leaving two of them.
SELECT cron.unschedule('notify-dispatch-safety-net')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notify-dispatch-safety-net');

SELECT cron.schedule(
  'notify-dispatch-safety-net',
  '*/5 * * * *',
  $job$
  SELECT net.http_post(
    url     := 'https://REPLACE_PROJECT_REF.supabase.co/functions/v1/notify-dispatch',
    headers := jsonb_build_object(
      'Content-Type',      'application/json',
      'x-dispatch-secret', 'REPLACE_WITH_NOTIFY_DISPATCH_SECRET'
    ),
    body    := '{"source":"cron"}'::jsonb
  );
  $job$
);

-- ── confirm it registered ───────────────────────────────────────────────────
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'notify-dispatch-safety-net';

-- Later, to see whether the job is actually running:
--   SELECT status, return_message, start_time
--     FROM cron.job_run_details
--    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'notify-dispatch-safety-net')
--    ORDER BY start_time DESC LIMIT 10;
--
-- To pause it without deleting it:
--   UPDATE cron.job SET active = false WHERE jobname = 'notify-dispatch-safety-net';
--
-- To remove it entirely:
--   SELECT cron.unschedule('notify-dispatch-safety-net');
