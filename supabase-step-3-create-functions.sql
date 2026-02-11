-- ============================================================================
-- STEP 3: Create Monthly Reset Function
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- Function to reset monthly report counter (run on 1st of each month)
CREATE OR REPLACE FUNCTION reset_monthly_report_counters()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET reports_generated_this_month = 0
  WHERE last_report_generated_at IS NOT NULL
    AND (
      EXTRACT(MONTH FROM last_report_generated_at) != EXTRACT(MONTH FROM CURRENT_DATE)
      OR EXTRACT(YEAR FROM last_report_generated_at) != EXTRACT(YEAR FROM CURRENT_DATE)
    );

  RAISE NOTICE 'Reset % user report counters', (SELECT COUNT(*) FROM user_profiles WHERE reports_generated_this_month = 0);
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job using pg_cron (if available)
-- Note: This requires pg_cron extension which may not be available on all Supabase plans
-- Alternative: Use Supabase Edge Functions with cron triggers

/*
-- Uncomment if pg_cron is available:

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule monthly reset (runs on 1st day of each month at 00:00 UTC)
SELECT cron.schedule(
  'reset-monthly-report-counters',
  '0 0 1 * *',
  'SELECT reset_monthly_report_counters();'
);
*/

-- Test the function (optional)
-- SELECT reset_monthly_report_counters();
