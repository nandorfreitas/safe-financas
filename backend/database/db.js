const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'finance.db');

let db;

function getDatabase() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Remove PRAGMA lines (already set programmatically) and execute
  const cleanedSchema = schema
    .split('\n')
    .filter(line => !line.trim().startsWith('PRAGMA'))
    .join('\n');

  db.exec(cleanedSchema);
  runMigrations();
}

function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    // Execute each statement independently so ALTER TABLE doesn't fail if column already exists
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
    for (const stmt of statements) {
      try {
        db.exec(stmt);
      } catch (err) {
        // Ignore "duplicate column" errors from re-running migrations
        if (!err.message.includes('duplicate column')) {
          console.error(`Migration error in ${file}: ${err.message}`);
        }
      }
    }
  }
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDatabase, closeDatabase, DB_PATH };
