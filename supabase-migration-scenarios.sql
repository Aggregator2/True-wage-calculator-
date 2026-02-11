-- Scenarios table for storing calculator data
-- Run this in Supabase SQL Editor

-- Create scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Scenario identification
  scenario_type TEXT NOT NULL DEFAULT 'comparison' CHECK (scenario_type IN ('primary', 'comparison')),
  is_primary BOOLEAN DEFAULT false,
  name TEXT NOT NULL,
  description TEXT,

  -- Calculator source
  calculator_type TEXT NOT NULL CHECK (calculator_type IN (
    'main', 'commute', 'geo', 'pension', 'car', 'student-loans', 'wfh', 'intensity', 'carers', 'fire', 'opportunity'
  )),

  -- The actual data (inputs + results)
  data JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only one primary scenario per user (enforced at DB level)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_per_user
ON scenarios(user_id)
WHERE is_primary = true;

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_type ON scenarios(user_id, scenario_type);

-- Enable Row Level Security
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Users can only see their own scenarios
CREATE POLICY "Users can view own scenarios" ON scenarios
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own scenarios
CREATE POLICY "Users can insert own scenarios" ON scenarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own scenarios
CREATE POLICY "Users can update own scenarios" ON scenarios
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own scenarios
CREATE POLICY "Users can delete own scenarios" ON scenarios
  FOR DELETE USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scenarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS scenarios_updated_at ON scenarios;
CREATE TRIGGER scenarios_updated_at
  BEFORE UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_scenarios_updated_at();

-- Report generations tracking (for analytics)
CREATE TABLE IF NOT EXISTS report_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'comprehensive',
  scenarios_included INTEGER DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for report_generations
ALTER TABLE report_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON report_generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON report_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
