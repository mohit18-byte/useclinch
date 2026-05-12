-- ════════════════════════════════════════════════════════════════
-- 011 — Proposal versioning system
-- ════════════════════════════════════════════════════════════════

-- Version snapshots
CREATE TABLE IF NOT EXISTS proposal_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  version_number  INT NOT NULL,
  content_snapshot    JSONB NOT NULL,
  sections_config_snapshot JSONB NOT NULL,
  change_summary  TEXT NOT NULL DEFAULT '',
  changed_sections TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposal_versions_proposal
  ON proposal_versions (proposal_id, version_number DESC);

-- Version tracking columns on proposals
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS current_version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS client_seen_version INT DEFAULT NULL;

-- RLS: allow service-role only (all API routes use service client)
ALTER TABLE proposal_versions ENABLE ROW LEVEL SECURITY;
