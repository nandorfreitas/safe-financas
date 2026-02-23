const accountsRepository = require('../repositories/accounts.repository');
const transactionsRepository = require('../repositories/transactions.repository');

class AccountsService {
    findAll() {
        return accountsRepository.findAll();
    }

    findById(id) {
        const account = accountsRepository.findById(id);
        if (!account) throw { status: 404, message: 'Account not found' };
        return account;
    }

    findActive() {
        return accountsRepository.findActive();
    }

    create(data) {
        return accountsRepository.create(data);
    }

    update(id, data) {
        this.findById(id);
        return accountsRepository.update(id, data);
    }

    delete(id) {
        this.findById(id);
        accountsRepository.delete(id);
    }

    getBalance(accountId) {
        const account = this.findById(accountId);
        const movements = transactionsRepository.getAccountBalance(accountId);

        const balance = account.initial_balance
            + movements.receitas
            - movements.despesas
            - movements.transferencias_saida
            + movements.transferencias_entrada;

        return {
            ...account,
            balance,
            movements
        };
    }

    getAllBalances() {
        const accounts = accountsRepository.findActive();
        return accounts.map(account => {
            const movements = transactionsRepository.getAccountBalance(account.id);
            const balance = account.initial_balance
                + movements.receitas
                - movements.despesas
                - movements.transferencias_saida
                + movements.transferencias_entrada;

            return { ...account, balance };
        });
    }
}

module.exports = new AccountsService();
