-- Add professional_title column to profiles
-- This lets freelancers customize the subtitle shown under their name on proposals
-- (e.g. "Independent Developer", "UI/UX Designer", "Full-Stack Consultant")

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS professional_title text DEFAULT 'Independent Developer';
