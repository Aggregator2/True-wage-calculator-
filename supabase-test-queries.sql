-- ============================================================================
-- VERIFICATION & TEST QUERIES
-- Use these to verify the migration was successful
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================================

-- ===========================
-- 1. VERIFY COLUMNS EXIST
-- ===========================

SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN (
    'reports_generated_this_month',
    'last_report_generated_at',
    'has_generated_preview'
  )
ORDER BY column_name;

-- Expected: 3 rows showing the new columns

-- ===========================
-- 2. VERIFY INDEXES EXIST
-- ===========================

SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE tablename = 'user_profiles'
  AND indexname LIKE '%report%';

-- Expected: At least 1 index containing 'report_tracking'

-- ===========================
-- 3. VERIFY FUNCTION EXISTS
-- ===========================

SELECT
  proname AS function_name,
  pg_get_functiondef(oid) AS definition
FROM pg_proc
WHERE proname = 'reset_monthly_report_counters';

-- Expected: 1 row showing the function

-- ===========================
-- 4. VIEW CURRENT USER DATA
-- ===========================

SELECT
  id,
  email,
  subscription_status,
  reports_generated_this_month,
  last_report_generated_at,
  has_generated_preview,
  created_at
FROM user_profiles
ORDER BY created_at DESC
LIMIT 10;

-- Shows current state of user report tracking

-- ===========================
-- 5. TEST RESET FUNCTION
-- ===========================

-- Test the monthly reset function
SELECT reset_monthly_report_counters();

-- Expected: Success (no error)

-- ===========================
-- 6. VIEW REPORT HISTORY
-- ===========================

SELECT
  rg.id,
  rg.user_id,
  up.email,
  rg.report_type,
  rg.is_preview,
  rg.created_at
FROM report_generations rg
JOIN user_profiles up ON rg.user_id = up.id
ORDER BY rg.created_at DESC
LIMIT 20;

-- Shows recent report generation history

-- ===========================
-- 7. RESET SPECIFIC USER (FOR TESTING)
-- ===========================

-- IMPORTANT: Replace 'your-user-id' with actual user ID

/*
UPDATE user_profiles
SET
  reports_generated_this_month = 0,
  has_generated_preview = FALSE,
  last_report_generated_at = NULL
WHERE id = 'your-user-id';
*/

-- ===========================
-- 8. SIMULATE LAST MONTH DATA (FOR TESTING)
-- ===========================

-- Test monthly reset by setting data to last month
-- Replace 'your-user-id' with actual user ID

/*
UPDATE user_profiles
SET
  last_report_generated_at = NOW() - INTERVAL '35 days',
  reports_generated_this_month = 5
WHERE id = 'your-user-id';

-- Now generate a report - counter should reset to 1
*/

-- ===========================
-- 9. VIEW RATE LIMIT STATUS FOR ALL USERS
-- ===========================

SELECT
  up.email,
  up.subscription_status,
  up.reports_generated_this_month,
  up.has_generated_preview,
  up.last_report_generated_at,
  CASE
    WHEN up.subscription_status IN ('premium', 'lifetime') THEN
      CASE
        WHEN up.reports_generated_this_month >= 5 THEN '🔴 Limit reached'
        ELSE '🟢 Can generate (' || (5 - up.reports_generated_this_month) || ' left)'
      END
    ELSE
      CASE
        WHEN up.has_generated_preview THEN '🔴 Preview used'
        ELSE '🟢 Can preview'
      END
  END AS rate_limit_status
FROM user_profiles up
ORDER BY up.last_report_generated_at DESC NULLS LAST;

-- Shows rate limit status for all users

-- ===========================
-- 10. CHECK FOR USERS WHO NEED RESET
-- ===========================

SELECT
  id,
  email,
  reports_generated_this_month,
  last_report_generated_at,
  EXTRACT(MONTH FROM last_report_generated_at) AS last_month,
  EXTRACT(MONTH FROM CURRENT_DATE) AS current_month
FROM user_profiles
WHERE last_report_generated_at IS NOT NULL
  AND (
    EXTRACT(MONTH FROM last_report_generated_at) != EXTRACT(MONTH FROM CURRENT_DATE)
    OR EXTRACT(YEAR FROM last_report_generated_at) != EXTRACT(YEAR FROM CURRENT_DATE)
  )
  AND reports_generated_this_month > 0;

-- Shows users whose counters should be reset
