-- ════════════════════════════════════════════════════════════════
-- 008 — Add proposal expiry support
-- ════════════════════════════════════════════════════════════════

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

-- Optional index for queries filtering expired proposals
CREATE INDEX IF NOT EXISTS idx_proposals_expires_at ON proposals (expires_at)
  WHERE expires_at IS NOT NULL;
