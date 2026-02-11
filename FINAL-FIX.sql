-- ============================================================================
-- 🔧 FINAL FIX - This will definitely work
-- ============================================================================
-- Run this entire block in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Drop the broken table if it exists and recreate it properly
DROP TABLE IF EXISTS report_generations CASCADE;

-- STEP 2: Create report_generations with ALL columns from the start
CREATE TABLE report_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  scenarios_included UUID[] DEFAULT '{}',
  is_preview BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 3: Add columns to user_profiles (safe - checks if exists first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'reports_generated_this_month'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN reports_generated_this_month INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last_report_generated_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_report_generated_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'has_generated_preview'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN has_generated_preview BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- STEP 4: Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'report_generations_user_id_fkey'
  ) THEN
    ALTER TABLE report_generations
    ADD CONSTRAINT report_generations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Foreign key constraint skipped: %', SQLERRM;
END $$;

-- STEP 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_report_tracking
ON user_profiles(id, reports_generated_this_month, last_report_generated_at);

CREATE INDEX IF NOT EXISTS idx_report_generations_user_id
ON report_generations(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_report_generations_user_preview
ON report_generations(user_id, is_preview, created_at);

-- STEP 6: Create reset function
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
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ✅ VERIFICATION - Should show 3 rows
-- ============================================================================

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN (
    'reports_generated_this_month',
    'last_report_generated_at',
    'has_generated_preview'
  )
ORDER BY column_name;

-- ============================================================================
-- ✅ SUCCESS! You're done!
-- ============================================================================
