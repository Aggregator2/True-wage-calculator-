-- ============================================================================
-- 📋 LEGACY VERSION - For systems using saved_scenarios table
-- ============================================================================
--
-- Use this if you're still using the old "saved_scenarios" table
-- instead of the new "report_generations" table
--
-- Instructions:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Click "New Query"
-- 3. Copy this ENTIRE file (Ctrl+A, Ctrl+C)
-- 4. Paste into SQL Editor (Ctrl+V)
-- 5. Click "Run" button or press Ctrl+Enter
-- 6. Wait for "Success" message
--
-- ============================================================================

-- ============================================================================
-- PART 1: Add Report Tracking Columns to user_profiles
-- ============================================================================

-- Add columns to user_profiles for report tracking
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS reports_generated_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_report_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS has_generated_preview BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.reports_generated_this_month IS 'Number of reports generated in current month (for rate limiting)';
COMMENT ON COLUMN user_profiles.last_report_generated_at IS 'Timestamp of last report generation';
COMMENT ON COLUMN user_profiles.has_generated_preview IS 'Whether user has generated their one-time free preview';

-- ============================================================================
-- PART 2: Create report_generations table (NEW - for future use)
-- ============================================================================

-- Create report_generations table for tracking
CREATE TABLE IF NOT EXISTS report_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  scenarios_included UUID[] DEFAULT '{}',
  is_preview BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'report_generations_user_id_fkey'
    AND table_name = 'report_generations'
  ) THEN
    ALTER TABLE report_generations
    ADD CONSTRAINT report_generations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE report_generations IS 'Tracks report generation for rate limiting and analytics';
COMMENT ON COLUMN report_generations.is_preview IS 'Whether this was a preview (limited) or full report';

-- ============================================================================
-- PART 3: Create Performance Indexes
-- ============================================================================

-- Create index for efficient report tracking queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_report_tracking
ON user_profiles(id, reports_generated_this_month, last_report_generated_at);

-- Create index for report_generations queries
CREATE INDEX IF NOT EXISTS idx_report_generations_user_id
ON report_generations(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_report_generations_user_preview
ON report_generations(user_id, is_preview, created_at);

-- ============================================================================
-- PART 4: Create Monthly Reset Function
-- ============================================================================

-- Function to reset monthly report counter (run on 1st of each month)
CREATE OR REPLACE FUNCTION reset_monthly_report_counters()
RETURNS void AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  -- Reset counters for users whose last report was in a different month
  UPDATE user_profiles
  SET reports_generated_this_month = 0
  WHERE last_report_generated_at IS NOT NULL
    AND (
      EXTRACT(MONTH FROM last_report_generated_at) != EXTRACT(MONTH FROM CURRENT_DATE)
      OR EXTRACT(YEAR FROM last_report_generated_at) != EXTRACT(YEAR FROM CURRENT_DATE)
    );

  -- Get count of reset users
  GET DIAGNOSTICS reset_count = ROW_COUNT;

  RAISE NOTICE 'Reset % user report counters', reset_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ✅ MIGRATION COMPLETE
-- ============================================================================
--
-- What was created:
-- ✓ Added tracking columns to user_profiles
-- ✓ Created report_generations table (new system)
-- ✓ Created performance indexes
-- ✓ Created monthly reset function
--
-- Next steps:
-- 1. Run verification query (see below)
-- 2. Test report generation
-- 3. Check QUICK-START.md
--
-- ============================================================================

-- VERIFICATION QUERY (run separately to verify):
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name LIKE '%report%';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'report_generations';
