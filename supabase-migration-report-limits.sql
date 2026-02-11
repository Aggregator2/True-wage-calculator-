-- ============================================================================
-- REPORT GENERATION TRACKING & LIMITS
-- Tracks report generation for rate limiting and cost management
-- ============================================================================

-- Add columns to user_profiles for report tracking
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS reports_generated_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_report_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS has_generated_preview BOOLEAN DEFAULT FALSE;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_report_tracking
ON user_profiles(id, reports_generated_this_month, last_report_generated_at);

-- Update report_generations table to track report type
ALTER TABLE report_generations
ADD COLUMN IF NOT EXISTS is_preview BOOLEAN DEFAULT FALSE;

-- Function to reset monthly report counter (run on 1st of each month)
CREATE OR REPLACE FUNCTION reset_monthly_report_counters()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET reports_generated_this_month = 0
  WHERE EXTRACT(MONTH FROM last_report_generated_at) != EXTRACT(MONTH FROM CURRENT_DATE)
    OR EXTRACT(YEAR FROM last_report_generated_at) != EXTRACT(YEAR FROM CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run this function monthly
-- Note: This requires pg_cron extension or external cron job
-- For Supabase, you can use their Edge Functions with cron triggers

COMMENT ON COLUMN user_profiles.reports_generated_this_month IS 'Number of reports generated in current month (for rate limiting)';
COMMENT ON COLUMN user_profiles.last_report_generated_at IS 'Timestamp of last report generation';
COMMENT ON COLUMN user_profiles.has_generated_preview IS 'Whether user has generated their one-time free preview';
COMMENT ON COLUMN report_generations.is_preview IS 'Whether this was a preview (limited) or full report';
