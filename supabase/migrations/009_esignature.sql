-- ════════════════════════════════════════════════════════════════
-- 009 — Add e-signature support to proposals
-- ════════════════════════════════════════════════════════════════

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS signature_data TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS signer_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ DEFAULT NULL;
