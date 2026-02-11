-- ============================================================================
-- STEP 2: Create Performance Indexes
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- Create index for efficient report tracking queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_report_tracking
ON user_profiles(id, reports_generated_this_month, last_report_generated_at);

-- Create index for report_generations queries
CREATE INDEX IF NOT EXISTS idx_report_generations_user_preview
ON report_generations(user_id, is_preview, created_at);
