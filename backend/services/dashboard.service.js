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
}

module.exports = new DashboardService();
