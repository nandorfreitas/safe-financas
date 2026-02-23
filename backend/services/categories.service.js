const categoriesRepository = require('../repositories/categories.repository');
const { getDatabase } = require('../database/db');

class CategoriesService {
    findAll() {
        return categoriesRepository.findAll();
    }

    findById(id) {
        const category = categoriesRepository.findById(id);
        if (!category) throw { status: 404, message: 'Category not found' };
        return category;
    }

    findByType(type) {
        return categoriesRepository.findByType(type);
    }

    create(data) {
        return categoriesRepository.create(data);
    }

    update(id, data) {
        this.findById(id);
        return categoriesRepository.update(id, data);
    }

    delete(id) {
        this.findById(id);
        categoriesRepository.delete(id);
    }

    getBudgetStatus(competence) {
        const db = getDatabase();
        const categories = categoriesRepository.findAll();

        return categories.map(cat => {
            const spent = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE category_id = ? AND competence = ? AND type = 'despesa'
      `).get(cat.id, competence);

            return {
                ...cat,
                spent: spent.total,
                remaining: cat.monthly_budget ? cat.monthly_budget - spent.total : null,
                percentage: cat.monthly_budget ? Math.round((spent.total / cat.monthly_budget) * 100) : null
            };
        });
    }
}

module.exports = new CategoriesService();
