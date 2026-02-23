const { getDatabase } = require('../database/db');

class CreditCardsRepository {
    findAll() {
        const db = getDatabase();
        return db.prepare(`
      SELECT cc.*, a.name as payment_account_name
      FROM credit_cards cc
      LEFT JOIN accounts a ON cc.payment_account_id = a.id
      ORDER BY cc.name
    `).all();
    }

    findById(id) {
        const db = getDatabase();
        return db.prepare(`
      SELECT cc.*, a.name as payment_account_name
      FROM credit_cards cc
      LEFT JOIN accounts a ON cc.payment_account_id = a.id
      WHERE cc.id = ?
    `).get(id);
    }

    findActive() {
        const db = getDatabase();
        return db.prepare(`
      SELECT cc.*, a.name as payment_account_name
      FROM credit_cards cc
      LEFT JOIN accounts a ON cc.payment_account_id = a.id
      WHERE cc.active = 1
      ORDER BY cc.name
    `).all();
    }

    create({ name, limit_total, closing_day, due_day, payment_account_id, active }) {
        const db = getDatabase();
        const stmt = db.prepare(
            'INSERT INTO credit_cards (name, limit_total, closing_day, due_day, payment_account_id, active) VALUES (?, ?, ?, ?, ?, ?)'
        );
        const result = stmt.run(name, limit_total, closing_day, due_day, payment_account_id || null, active ?? 1);
        return this.findById(result.lastInsertRowid);
    }

    update(id, { name, limit_total, closing_day, due_day, payment_account_id, active }) {
        const db = getDatabase();
        const stmt = db.prepare(
            'UPDATE credit_cards SET name = ?, limit_total = ?, closing_day = ?, due_day = ?, payment_account_id = ?, active = ? WHERE id = ?'
        );
        stmt.run(name, limit_total, closing_day, due_day, payment_account_id || null, active, id);
        return this.findById(id);
    }

    delete(id) {
        const db = getDatabase();
        db.prepare('DELETE FROM credit_cards WHERE id = ?').run(id);
    }
}

module.exports = new CreditCardsRepository();
