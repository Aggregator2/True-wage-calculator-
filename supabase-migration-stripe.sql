-- Migration: Add Stripe subscription fields to user_profiles
-- Run this in your Supabase SQL Editor if you have an existing database

-- Add new columns for subscription management
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS subscription_id TEXT;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Update the subscription_status check constraint to include 'lifetime'
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_subscription_status_check;

ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_subscription_status_check
CHECK (subscription_status IN ('free', 'premium', 'lifetime', 'cancelled'));

-- Add index for Stripe customer lookups (for webhook handlers)
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id
ON user_profiles(stripe_customer_id);

-- Add index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_id
ON user_profiles(subscription_id);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
