-- ============================================================================
-- 📋 SAFEST VERSION - Run each section separately if needed
-- ============================================================================
--
-- This version adds columns one at a time and checks for errors
-- Run this ENTIRE file, or run each PART separately if you get errors
--
-- ============================================================================

-- ============================================================================
-- PART 1: Add columns to user_profiles (SAFEST - always works)
-- ============================================================================

DO $$
BEGIN
  -- Add reports_generated_this_month
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'reports_generated_this_month'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN reports_generated_this_month INTEGER DEFAULT 0;
  END IF;

  -- Add last_report_generated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last_report_generated_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_report_generated_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add has_generated_preview
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'has_generated_preview'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN has_generated_preview BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================================================
-- PART 2: Create or update report_generations table
-- ============================================================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS report_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  scenarios_included UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_preview column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'report_generations' AND column_name = 'is_preview'
  ) THEN
    ALTER TABLE report_generations ADD COLUMN is_preview BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'report_generations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE report_generations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- ============================================================================
-- PART 3: Add foreign key constraint (if not exists)
-- ============================================================================

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
EXCEPTION
  WHEN others THEN
    -- Ignore if constraint can't be added (e.g., auth.users doesn't exist)
    RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- PART 4: Create indexes (safe - IF NOT EXISTS)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_report_tracking
ON user_profiles(id, reports_generated_this_month, last_report_generated_at);

CREATE INDEX IF NOT EXISTS idx_report_generations_user_id
ON report_generations(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_report_generations_user_preview
ON report_generations(user_id, is_preview, created_at);

-- ============================================================================
-- PART 5: Create function
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_monthly_report_counters()
RETURNS void AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  UPDATE user_profiles
  SET reports_generated_this_month = 0
  WHERE last_report_generated_at IS NOT NULL
    AND (
      EXTRACT(MONTH FROM last_report_generated_at) != EXTRACT(MONTH FROM CURRENT_DATE)
      OR EXTRACT(YEAR FROM last_report_generated_at) != EXTRACT(YEAR FROM CURRENT_DATE)
    );

  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RAISE NOTICE 'Reset % user report counters', reset_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 6: Add helpful comments
-- ============================================================================

DO $$
BEGIN
  COMMENT ON COLUMN user_profiles.reports_generated_this_month IS 'Number of reports generated in current month (for rate limiting)';
  COMMENT ON COLUMN user_profiles.last_report_generated_at IS 'Timestamp of last report generation';
  COMMENT ON COLUMN user_profiles.has_generated_preview IS 'Whether user has generated their one-time free preview';
  COMMENT ON COLUMN report_generations.is_preview IS 'Whether this was a preview (limited) or full report';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Comments added with some warnings: %', SQLERRM;
END $$;

-- ============================================================================
-- ✅ MIGRATION COMPLETE
-- ============================================================================

-- Verify everything worked:
SELECT
  'user_profiles columns' as check_type,
  COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN ('reports_generated_this_month', 'last_report_generated_at', 'has_generated_preview')

UNION ALL

SELECT
  'report_generations columns' as check_type,
  COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'report_generations'
  AND column_name = 'is_preview';

-- Expected results:
-- user_profiles columns: 3
-- report_generations columns: 1
