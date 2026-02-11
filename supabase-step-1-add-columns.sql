-- ============================================================================
-- STEP 1: Add Report Tracking Columns
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- Add columns to user_profiles for report tracking
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS reports_generated_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_report_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS has_generated_preview BOOLEAN DEFAULT FALSE;

-- Update report_generations table to track report type
ALTER TABLE report_generations
ADD COLUMN IF NOT EXISTS is_preview BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.reports_generated_this_month IS 'Number of reports generated in current month (for rate limiting)';
COMMENT ON COLUMN user_profiles.last_report_generated_at IS 'Timestamp of last report generation';
COMMENT ON COLUMN user_profiles.has_generated_preview IS 'Whether user has generated their one-time free preview';
COMMENT ON COLUMN report_generations.is_preview IS 'Whether this was a preview (limited) or full report';
