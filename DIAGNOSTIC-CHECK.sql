-- ============================================================================
-- 🔍 DIAGNOSTIC CHECK - Run this first to see what you have
-- ============================================================================
-- Copy this into Supabase SQL Editor and run it
-- This will show us what tables and columns exist
-- ============================================================================

-- Check 1: List all your tables
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check 2: Check user_profiles structure
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check 3: Check if report_generations exists
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'report_generations'
ORDER BY ordinal_position;

-- Check 4: Check saved_scenarios (legacy table)
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'saved_scenarios'
ORDER BY ordinal_position;

-- ============================================================================
-- RESULTS INTERPRETATION:
-- ============================================================================
--
-- If "report_generations" shows NO ROWS:
--   → Table doesn't exist, use COPY-THIS-TO-SUPABASE-FIXED.sql
--
-- If "user_profiles" shows NO ROWS:
--   → Table doesn't exist, you need to create it first
--
-- If "saved_scenarios" shows rows but "report_generations" doesn't:
--   → You're using legacy schema, use COPY-THIS-TO-SUPABASE-FIXED.sql
--
-- ============================================================================
