-- Add retirement and investment account types
ALTER TABLE accounts DROP CONSTRAINT accounts_type_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_type_check
  CHECK (type = ANY (ARRAY['checking', 'savings', 'credit_card', 'cash', 'retirement', 'investment']));
