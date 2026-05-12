-- ═══════════════════════════════════════════════════════════════
-- 006_invoice_payment_claimed.sql
-- Adds payment_claimed status and payment_claimed_at timestamp
-- to the invoices table.
-- ═══════════════════════════════════════════════════════════════

-- 1. Relax the status CHECK constraint to include 'payment_claimed'
--    We drop and recreate the constraint.

ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('unpaid', 'payment_claimed', 'paid', 'cancelled'));

-- 2. Add the timestamp column for when the client clicked "I've Made Payment"
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS payment_claimed_at timestamptz;
