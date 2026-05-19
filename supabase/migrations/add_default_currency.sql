-- Multi-currency support migration
-- Run this in your Supabase SQL editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS default_currency text NOT NULL DEFAULT 'USD';

-- Backfill existing users to USD (already the default but being explicit)
UPDATE profiles SET default_currency = 'USD' WHERE default_currency IS NULL;
