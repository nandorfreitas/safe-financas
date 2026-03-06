-- SQLite does not support ALTER TABLE DROP CONSTRAINT.
-- To modify the CHECK constraint on categories(type), we recreate the table.

PRAGMA foreign_keys=off;

BEGIN TRANSACTION;

-- Create the new table with the updated constraint
CREATE TABLE new_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa', 'transferencia')),
  monthly_budget REAL,
  essential INTEGER NOT NULL DEFAULT 0,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
);

-- Copy data from the old table to the new one
INSERT INTO new_categories (id, name, type, monthly_budget, essential, parent_id)
SELECT id, name, type, monthly_budget, essential, parent_id FROM categories;

-- Drop the old table
DROP TABLE categories;

-- Rename the new table
ALTER TABLE new_categories RENAME TO categories;

COMMIT;

PRAGMA foreign_keys=on;
