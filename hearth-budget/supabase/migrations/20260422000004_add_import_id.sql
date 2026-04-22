-- Add import_id to transactions for batch undo capability
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS import_id uuid REFERENCES imports(id) ON DELETE CASCADE;

-- Index for fast lookup of all transactions in an import batch
CREATE INDEX IF NOT EXISTS transactions_import_id_idx
  ON transactions (import_id)
  WHERE import_id IS NOT NULL;
