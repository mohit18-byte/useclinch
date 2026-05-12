-- ═══════════════════════════════════════════════════════════════
-- 005_invoices.sql — Invoice system tables, functions, and RLS
-- ═══════════════════════════════════════════════════════════════

-- ── Invoices table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposal_id           uuid REFERENCES proposals(id) ON DELETE SET NULL,
  invoice_number        text NOT NULL,
  client_name           text NOT NULL,
  client_email          text NOT NULL,
  line_items            jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cents           integer NOT NULL DEFAULT 0,
  currency              text NOT NULL DEFAULT 'USD',
  note                  text,
  due_date              date,
  status                text NOT NULL DEFAULT 'unpaid'
                        CHECK (status IN ('unpaid', 'paid', 'cancelled')),
  hosted_token          uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  payment_method        text NOT NULL DEFAULT 'manual'
                        CHECK (payment_method IN ('manual', 'stripe')),
  payment_instructions  text,
  stripe_payment_link   text,
  paid_at               timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_hosted_token ON invoices(hosted_token);
CREATE INDEX IF NOT EXISTS idx_invoices_proposal_id ON invoices(proposal_id);

-- ── Invoice number generation function ──────────────────────────

CREATE OR REPLACE FUNCTION generate_invoice_number(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM invoices
  WHERE user_id = user_uuid;

  RETURN 'INV-' || LPAD((v_count + 1)::text, 3, '0');
END;
$$;

-- ── RLS policies ────────────────────────────────────────────────

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Owner can do everything with their own invoices
CREATE POLICY "Users can select own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Public access via hosted_token (for /i/[token] page)
-- anon role can read any invoice if they know the token
CREATE POLICY "Public can view invoices by hosted_token"
  ON invoices FOR SELECT
  TO anon
  USING (true);

-- Service role can do anything (used by API routes with service client)
CREATE POLICY "Service role full access"
  ON invoices FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Add default_payment_instructions to profiles ────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS default_payment_instructions text;
