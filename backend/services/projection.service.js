const transactionsRepository = require('../repositories/transactions.repository');
const accountsService = require('./accounts.service');
const creditCardsService = require('./credit-cards.service');

class ProjectionService {
    getProjection(months = 12) {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;

        // Use initial_balance (not current balance) to avoid double-counting transactions
        const accountBalances = accountsService.getAllBalances();
        let saldoAcumulado = accountBalances.reduce((sum, a) => sum + a.initial_balance, 0);

        const projections = [];

        for (let i = 0; i < months; i++) {
            const date = new Date(currentYear, currentMonth - 1 + i, 1);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const competence = `${year}-${month}`;

            const sums = transactionsRepository.getSumByCompetence(competence);
            const receitas = sums.total_receitas;
            const despesas = sums.total_despesas + sums.total_cartao;
            const resultado = receitas - despesas;

            saldoAcumulado += resultado;

            // Card debt for this month
            const cardInvoices = creditCardsService.getAllInvoices(competence);
            const faturas_pendentes = cardInvoices.reduce((sum, c) => sum + c.invoice_total, 0);

            projections.push({
                competence,
                receitas,
                despesas, // includes non-card despesas and total_cartao (card expenses)
                resultado,
                saldo_acumulado: saldoAcumulado,
                total_gastos_cartao: sums.total_cartao,
                faturas_pendentes,
                patrimonio_projetado: saldoAcumulado - faturas_pendentes
            });
        }

        return projections;
    }
}

module.exports = new ProjectionService();
