-- Email Subscribers table for newsletter signups
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  gdpr_consent BOOLEAN DEFAULT false NOT NULL,
  source TEXT DEFAULT 'calculator_banner',
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_active ON email_subscribers(is_active);

-- Enable Row Level Security
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can insert (from API routes)
CREATE POLICY "Service role can insert subscribers" ON email_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only service role can select (for exports)
CREATE POLICY "Service role can select subscribers" ON email_subscribers
  FOR SELECT
  USING (true);

-- Policy: Allow updates for unsubscribe
CREATE POLICY "Service role can update subscribers" ON email_subscribers
  FOR UPDATE
  USING (true);
