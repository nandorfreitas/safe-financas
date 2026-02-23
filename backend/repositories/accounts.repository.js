const { getDatabase } = require('../database/db');

class AccountsRepository {
    findAll() {
        const db = getDatabase();
        return db.prepare('SELECT * FROM accounts ORDER BY name').all();
    }

    findById(id) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    }

    findActive() {
        const db = getDatabase();
        return db.prepare('SELECT * FROM accounts WHERE active = 1 ORDER BY name').all();
    }

    create({ name, type, initial_balance, active }) {
        const db = getDatabase();
        const stmt = db.prepare(
            'INSERT INTO accounts (name, type, initial_balance, active) VALUES (?, ?, ?, ?)'
        );
        const result = stmt.run(name, type, initial_balance ?? 0, active ?? 1);
        return this.findById(result.lastInsertRowid);
    }

    update(id, { name, type, initial_balance, active }) {
        const db = getDatabase();
        const stmt = db.prepare(
            'UPDATE accounts SET name = ?, type = ?, initial_balance = ?, active = ? WHERE id = ?'
        );
        stmt.run(name, type, initial_balance, active, id);
        return this.findById(id);
    }

    delete(id) {
        const db = getDatabase();
        db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
    }
}

module.exports = new AccountsRepository();
