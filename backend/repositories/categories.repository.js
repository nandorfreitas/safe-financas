const { getDatabase } = require('../database/db');

class CategoriesRepository {
    findAll() {
        const db = getDatabase();
        return db.prepare('SELECT * FROM categories ORDER BY parent_id, type, name').all();
    }

    findById(id) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    }

    findByType(type) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY parent_id, name').all(type);
    }

    create({ name, type, monthly_budget, essential, parent_id }) {
        const db = getDatabase();
        const stmt = db.prepare(
            'INSERT INTO categories (name, type, monthly_budget, essential, parent_id) VALUES (?, ?, ?, ?, ?)'
        );
        const result = stmt.run(name, type, monthly_budget || null, essential ?? 0, parent_id || null);
        return this.findById(result.lastInsertRowid);
    }

    update(id, { name, type, monthly_budget, essential, parent_id }) {
        const db = getDatabase();
        const stmt = db.prepare(
            'UPDATE categories SET name = ?, type = ?, monthly_budget = ?, essential = ?, parent_id = ? WHERE id = ?'
        );
        stmt.run(name, type, monthly_budget || null, essential, parent_id || null, id);
        return this.findById(id);
    }

    delete(id) {
        const db = getDatabase();
        db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    }
}

module.exports = new CategoriesRepository();
