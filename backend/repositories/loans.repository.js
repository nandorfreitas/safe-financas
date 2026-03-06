const { getDatabase } = require('../database/db');

class LoansRepository {
    findAll() {
        const db = getDatabase();
        return db.prepare(`
            SELECT l.*, c.name as category_name
            FROM loans l
            LEFT JOIN categories c ON l.linked_category_id = c.id
            ORDER BY l.status, l.title
        `).all();
    }

    findById(id) {
        const db = getDatabase();
        return db.prepare(`
            SELECT l.*, c.name as category_name
            FROM loans l
            LEFT JOIN categories c ON l.linked_category_id = c.id
            WHERE l.id = ?
        `).get(id);
    }

    findByCategoryId(categoryId) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM loans WHERE linked_category_id = ?').all(categoryId);
    }

    create({ title, type, total_amount, total_installments, linked_category_id, installment_value }) {
        const db = getDatabase();
        const stmt = db.prepare(`
            INSERT INTO loans (title, type, total_amount, remaining_balance, total_installments, linked_category_id, installment_value)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        // New loans start with remaining = total
        const result = stmt.run(title, type, total_amount, total_amount, total_installments, linked_category_id || null, installment_value || 0);
        return this.findById(result.lastInsertRowid);
    }

    update(id, { title, type, total_amount, remaining_balance, total_installments, paid_installments, linked_category_id, status, installment_value }) {
        const db = getDatabase();
        const stmt = db.prepare(`
            UPDATE loans SET
                title = ?, type = ?, total_amount = ?, remaining_balance = ?, total_installments = ?,
                paid_installments = ?, linked_category_id = ?, status = ?, installment_value = ?
            WHERE id = ?
        `);
        stmt.run(title, type, total_amount, remaining_balance, total_installments, paid_installments, linked_category_id || null, status, installment_value || 0, id);
        return this.findById(id);
    }

    delete(id) {
        const db = getDatabase();
        db.prepare('DELETE FROM loans WHERE id = ?').run(id);
    }
}

module.exports = new LoansRepository();
