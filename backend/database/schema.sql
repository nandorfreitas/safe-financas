-- ============================================
-- SAFE Finanças - Database Schema
-- ============================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================
-- ACCOUNTS
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('corrente', 'poupanca', 'investimento', 'carteira')),
  initial_balance REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

-- ============================================
-- CREDIT CARDS
-- ============================================
CREATE TABLE IF NOT EXISTS credit_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  limit_total REAL NOT NULL DEFAULT 0,
  closing_day INTEGER NOT NULL,
  due_day INTEGER NOT NULL,
  payment_account_id INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (payment_account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa', 'transferencia')),
  monthly_budget REAL,
  essential INTEGER NOT NULL DEFAULT 0,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
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
  status TEXT NOT NULL DEFAULT 'previsto' CHECK (status IN ('previsto', 'pago')),
  fixed INTEGER NOT NULL DEFAULT 0,
  installment_total INTEGER DEFAULT 1,
  installment_number INTEGER DEFAULT 1,
  subtype TEXT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE SET NULL
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_transactions_competence ON transactions(competence);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_credit_card_id ON transactions(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);

-- ============================================
-- LOANS & FINANCING
-- ============================================
CREATE TABLE IF NOT EXISTS loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('emprestimo_concedido', 'financiamento')),
  total_amount REAL NOT NULL,
  remaining_balance REAL NOT NULL,
  total_installments INTEGER NOT NULL,
  paid_installments INTEGER NOT NULL DEFAULT 0,
  linked_category_id INTEGER,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'quitado')),
  FOREIGN KEY (linked_category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_loans_category_id ON loans(linked_category_id);
