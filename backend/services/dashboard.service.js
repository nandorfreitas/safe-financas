const transactionsRepository = require('../repositories/transactions.repository');
const accountsService = require('./accounts.service');
const creditCardsService = require('./credit-cards.service');

class DashboardService {
    getDashboard(competence) {
        const sums = transactionsRepository.getSumByCompetence(competence);
        const resultado = sums.total_receitas - sums.total_despesas - sums.total_cartao;

        // All account balances
        const accountBalances = accountsService.getAllBalances();
        const totalAccounts = accountBalances.reduce((sum, a) => sum + a.balance, 0);

        // Investment accounts
        const investments = accountBalances
            .filter(a => a.type === 'investimento')
            .reduce((sum, a) => sum + a.balance, 0);

        // Credit card totals
        const cardInvoices = creditCardsService.getAllInvoices(competence);
        const totalCartao = cardInvoices.reduce((sum, c) => sum + c.invoice_total, 0);

        // Patrimony
        const ativos = totalAccounts;
        const passivos = totalCartao;
        const patrimonio_liquido = ativos - passivos;

        return {
            competence,
            total_receitas: sums.total_receitas,
            total_despesas: sums.total_despesas + sums.total_cartao,
            resultado,
            saldo_contas: totalAccounts,
            total_cartao: totalCartao,
            patrimonio: {
                ativos,
                passivos,
                patrimonio_liquido
            },
            contas: accountBalances,
            cartoes: cardInvoices
        };
    }

    getExpensesByCategory(competence) {
        const { getDatabase } = require('../database/db');
        const db = getDatabase();

        // Get all expense transactions for this competence, grouped by category
        // Roll up child categories into their parent
        const rows = db.prepare(`
            SELECT 
                COALESCE(parent.id, c.id) as category_id,
                COALESCE(parent.name, c.name) as category_name,
                SUM(t.amount) as total
            FROM transactions t
            LEFT JOIN categories c ON c.id = t.category_id
            LEFT JOIN categories parent ON parent.id = c.parent_id
            WHERE t.competence = ? AND t.type = 'despesa'
            GROUP BY COALESCE(parent.id, c.id)
            ORDER BY total DESC
        `).all(competence);

        // Handle uncategorized transactions (category_id is null)
        const uncategorized = db.prepare(`
            SELECT SUM(amount) as total
            FROM transactions
            WHERE competence = ? AND type = 'despesa' AND category_id IS NULL
        `).get(competence);

        const result = rows.filter(r => r.category_id !== null);

        if (uncategorized && uncategorized.total > 0) {
            result.push({
                category_id: null,
                category_name: 'Sem categoria',
                total: uncategorized.total
            });
        }

        return result.sort((a, b) => b.total - a.total);
    }
}
module.exports = new DashboardService();
