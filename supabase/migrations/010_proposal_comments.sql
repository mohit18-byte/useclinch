-- ════════════════════════════════════════════════════════════════
-- 010 — Client commenting on proposals
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS proposal_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,

  -- NULL = general question, non-null = inline comment on a section
  section_key TEXT DEFAULT NULL,

  author_name TEXT NOT NULL,
  author_email TEXT DEFAULT NULL,
  message     TEXT NOT NULL,

  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by proposal
CREATE INDEX IF NOT EXISTS idx_proposal_comments_proposal
  ON proposal_comments (proposal_id, created_at DESC);

-- RLS: allow service-role only (public API routes use service client)
ALTER TABLE proposal_comments ENABLE ROW LEVEL SECURITY;
