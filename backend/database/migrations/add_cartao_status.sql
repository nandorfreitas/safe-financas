-- Add 'cartao' status to transactions table.
-- SQLite does not support ALTER TABLE MODIFY CONSTRAINT,
-- so we must recreate the table with the new constraint.

PRAGMA foreign_keys=off;

BEGIN TRANSACTION;

CREATE TABLE new_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa', 'transferencia')),
  category_id INTEGER,
  account_id INTEGER,
  credit_card_id INTEGER,
  launch_date TEXT NOT NULL,
  competence TEXT NOT NULL,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'previsto' CHECK (status IN ('previsto', 'pago', 'cartao')),
  fixed INTEGER NOT NULL DEFAULT 0,
  installment_total INTEGER DEFAULT 1,
  installment_number INTEGER DEFAULT 1,
  subtype TEXT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE SET NULL
);

INSERT INTO new_transactions (id, description, amount, type, category_id, account_id, credit_card_id, launch_date, competence, due_date, status, fixed, installment_total, installment_number, subtype)
SELECT id, description, amount, type, category_id, account_id, credit_card_id, launch_date, competence, due_date, status, fixed, installment_total, installment_number, subtype FROM transactions;

DROP TABLE transactions;

ALTER TABLE new_transactions RENAME TO transactions;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_transactions_competence ON transactions(competence);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_credit_card_id ON transactions(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);

-- Migrate existing transactions: if credit_card_id is set and status is 'previsto', set status to 'cartao'
UPDATE transactions SET status = 'cartao' WHERE credit_card_id IS NOT NULL AND status = 'previsto';

COMMIT;

PRAGMA foreign_keys=on;
