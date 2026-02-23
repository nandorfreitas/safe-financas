const { getDatabase } = require('../database/db');

class TransactionsRepository {
    findAll({ competence, account_id, credit_card_id, category_id, type, status }) {
        const db = getDatabase();
        let query = `
      SELECT t.*, c.name as category_name, a.name as account_name, cc.name as credit_card_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN credit_cards cc ON t.credit_card_id = cc.id
      WHERE 1=1
    `;
        const params = [];

        if (competence) {
            query += ' AND t.competence = ?';
            params.push(competence);
        }
        if (account_id) {
            query += ' AND t.account_id = ?';
            params.push(account_id);
        }
        if (credit_card_id) {
            query += ' AND t.credit_card_id = ?';
            params.push(credit_card_id);
        }
        if (category_id) {
            query += ' AND t.category_id = ?';
            params.push(category_id);
        }
        if (type) {
            query += ' AND t.type = ?';
            params.push(type);
        }
        if (status) {
            query += ' AND t.status = ?';
            params.push(status);
        }

        query += ' ORDER BY t.due_date ASC, t.launch_date ASC';

        return db.prepare(query).all(...params);
    }

    findById(id) {
        const db = getDatabase();
        return db.prepare(`
      SELECT t.*, c.name as category_name, a.name as account_name, cc.name as credit_card_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN credit_cards cc ON t.credit_card_id = cc.id
      WHERE t.id = ?
    `).get(id);
    }

    findByCompetenceRange(startCompetence, endCompetence) {
        const db = getDatabase();
        return db.prepare(`
      SELECT t.*, c.name as category_name, a.name as account_name, cc.name as credit_card_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN credit_cards cc ON t.credit_card_id = cc.id
      WHERE t.competence >= ? AND t.competence <= ?
      ORDER BY t.competence ASC, t.due_date ASC
    `).all(startCompetence, endCompetence);
    }

    create({ description, amount, type, category_id, account_id, credit_card_id, launch_date, competence, due_date, status, fixed, installment_total, installment_number, subtype }) {
        const db = getDatabase();
        const stmt = db.prepare(`
      INSERT INTO transactions (description, amount, type, category_id, account_id, credit_card_id, launch_date, competence, due_date, status, fixed, installment_total, installment_number, subtype)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(
            description, amount, type,
            category_id || null, account_id || null, credit_card_id || null,
            launch_date, competence, due_date || null,
            status || 'previsto', fixed || 0,
            installment_total || 1, installment_number || 1,
            subtype || null
        );
        return this.findById(result.lastInsertRowid);
    }

    createMany(transactions) {
        const db = getDatabase();
        const stmt = db.prepare(`
      INSERT INTO transactions (description, amount, type, category_id, account_id, credit_card_id, launch_date, competence, due_date, status, fixed, installment_total, installment_number, subtype)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        const insertMany = db.transaction((items) => {
            const results = [];
            for (const t of items) {
                const result = stmt.run(
                    t.description, t.amount, t.type,
                    t.category_id || null, t.account_id || null, t.credit_card_id || null,
                    t.launch_date, t.competence, t.due_date || null,
                    t.status || 'previsto', t.fixed || 0,
                    t.installment_total || 1, t.installment_number || 1,
                    t.subtype || null
                );
                results.push(result.lastInsertRowid);
            }
            return results;
        });

        return insertMany(transactions);
    }

    update(id, { description, amount, type, category_id, account_id, credit_card_id, launch_date, competence, due_date, status, fixed, installment_total, installment_number, subtype }) {
        const db = getDatabase();
        const stmt = db.prepare(`
      UPDATE transactions SET
        description = ?, amount = ?, type = ?, category_id = ?, account_id = ?,
        credit_card_id = ?, launch_date = ?, competence = ?, due_date = ?,
        status = ?, fixed = ?, installment_total = ?, installment_number = ?, subtype = ?
      WHERE id = ?
    `);
        stmt.run(
            description, amount, type,
            category_id || null, account_id || null, credit_card_id || null,
            launch_date, competence, due_date || null,
            status, fixed || 0,
            installment_total || 1, installment_number || 1,
            subtype || null, id
        );
        return this.findById(id);
    }

    delete(id) {
        const db = getDatabase();
        db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    }

    getSumByCompetence(competence) {
        const db = getDatabase();
        return db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'receita' THEN amount ELSE 0 END), 0) as total_receitas,
        COALESCE(SUM(CASE WHEN type = 'despesa' AND credit_card_id IS NULL THEN amount ELSE 0 END), 0) as total_despesas,
        COALESCE(SUM(CASE WHEN type = 'despesa' AND credit_card_id IS NOT NULL THEN amount ELSE 0 END), 0) as total_cartao
      FROM transactions
      WHERE competence = ?
    `).get(competence);
    }

    getAccountBalance(accountId) {
        const db = getDatabase();
        return db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'receita' AND status = 'pago' THEN amount ELSE 0 END), 0) as receitas,
        COALESCE(SUM(CASE WHEN type = 'despesa' AND credit_card_id IS NULL AND status = 'pago' THEN amount ELSE 0 END), 0) as despesas,
        COALESCE(SUM(CASE WHEN type = 'transferencia' AND account_id = ? AND status = 'pago' THEN amount ELSE 0 END), 0) as transferencias_saida,
        COALESCE(SUM(CASE WHEN type = 'transferencia' AND subtype = CAST(? AS TEXT) AND status = 'pago' THEN amount ELSE 0 END), 0) as transferencias_entrada
      FROM transactions
      WHERE (account_id = ? OR subtype = CAST(? AS TEXT))
    `).get(accountId, accountId, accountId, accountId);
    }

    getCreditCardInvoice(creditCardId, competence) {
        const db = getDatabase();
        return db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE credit_card_id = ? AND competence = ? AND type = 'despesa'
    `).get(creditCardId, competence);
    }
}

module.exports = new TransactionsRepository();
