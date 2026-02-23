const { getDatabase } = require('../database/db');

class CategoriesRepository {
    findAll() {
        const db = getDatabase();
        return db.prepare('SELECT * FROM categories ORDER BY type, name').all();
    }

    findById(id) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    }

    findByType(type) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY name').all(type);
    }

    create({ name, type, monthly_budget, essential }) {
        const db = getDatabase();
        const stmt = db.prepare(
            'INSERT INTO categories (name, type, monthly_budget, essential) VALUES (?, ?, ?, ?)'
        );
        const result = stmt.run(name, type, monthly_budget || null, essential ?? 0);
        return this.findById(result.lastInsertRowid);
    }

    update(id, { name, type, monthly_budget, essential }) {
        const db = getDatabase();
        const stmt = db.prepare(
            'UPDATE categories SET name = ?, type = ?, monthly_budget = ?, essential = ? WHERE id = ?'
        );
        stmt.run(name, type, monthly_budget || null, essential, id);
        return this.findById(id);
    }

    delete(id) {
        const db = getDatabase();
        db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    }
}

module.exports = new CategoriesRepository();
