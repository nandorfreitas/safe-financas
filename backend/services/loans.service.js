const loansRepository = require('../repositories/loans.repository');

class LoansService {
    findAll() {
        return loansRepository.findAll();
    }

    findById(id) {
        const loan = loansRepository.findById(id);
        if (!loan) throw { status: 404, message: 'Loan/Financing not found' };
        return loan;
    }

    create(data) {
        return loansRepository.create(data);
    }

    update(id, data) {
        const loan = this.findById(id);
        const updatedData = { ...loan, ...data };
        return loansRepository.update(id, updatedData);
    }

    delete(id) {
        this.findById(id);
        loansRepository.delete(id);
    }

    updateLoanProgress(categoryId, transactionAmount, isReverted = false) {
        if (!categoryId) return;

        // Find single active loan for this category
        const loans = loansRepository.findByCategoryId(categoryId);
        if (!loans || loans.length === 0) return;

        const loan = loans.find(l => l.status === 'ativo');
        if (!loan) return;

        // Calculate new values based on transaction
        // If it's a new transaction (not reverted), we increment paid and deduct remaining
        let paid = loan.paid_installments;
        let remaining = loan.remaining_balance;

        if (isReverted) {
            paid = Math.max(0, paid - 1);
            remaining = Math.min(loan.total_amount, remaining + transactionAmount);
        } else {
            paid = Math.min(loan.total_installments, paid + 1);
            remaining = Math.max(0, remaining - transactionAmount);
        }

        const status = (paid >= loan.total_installments || remaining <= 0) ? 'quitado' : 'ativo';

        loansRepository.update(loan.id, {
            ...loan,
            paid_installments: paid,
            remaining_balance: remaining,
            status
        });
    }
}

module.exports = new LoansService();
