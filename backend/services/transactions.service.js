const transactionsRepository = require('../repositories/transactions.repository');

class TransactionsService {
    findAll(filters) {
        return transactionsRepository.findAll(filters);
    }

    findById(id) {
        const transaction = transactionsRepository.findById(id);
        if (!transaction) throw { status: 404, message: 'Transaction not found' };
        return transaction;
    }

    create(data) {
        const { installment_total, fixed } = data;
        let createdTransactions;

        if (installment_total && installment_total > 1) {
            createdTransactions = this._createInstallments(data);
        } else if (fixed) {
            createdTransactions = this._createFixed(data);
        } else {
            createdTransactions = [transactionsRepository.create(data)];
        }

        // Apply loan updates for newly created paid transactions
        createdTransactions.forEach(t => {
            if (t.status === 'pago') {
                const loansService = require('./loans.service');
                loansService.updateLoanProgress(t.category_id, t.amount, false);
            }
        });

        return createdTransactions.length === 1 ? createdTransactions[0] : createdTransactions;
    }

    update(id, data) {
        const oldTransaction = this.findById(id);
        const newTransaction = transactionsRepository.update(id, data);

        const loansService = require('./loans.service');

        // Status changed from previsto to pago
        if (oldTransaction.status !== 'pago' && newTransaction.status === 'pago') {
            loansService.updateLoanProgress(newTransaction.category_id, newTransaction.amount, false);
        }
        // Status changed from pago to previsto (reverted)
        else if (oldTransaction.status === 'pago' && newTransaction.status !== 'pago') {
            loansService.updateLoanProgress(oldTransaction.category_id, oldTransaction.amount, true);
        }
        // Amount changed while still paid
        else if (oldTransaction.status === 'pago' && newTransaction.status === 'pago' && oldTransaction.amount !== newTransaction.amount) {
            loansService.updateLoanProgress(oldTransaction.category_id, oldTransaction.amount, true); // Revert old
            loansService.updateLoanProgress(newTransaction.category_id, newTransaction.amount, false); // Apply new
        }

        return newTransaction;
    }

    delete(id) {
        const transaction = this.findById(id);

        if (transaction.status === 'pago') {
            const loansService = require('./loans.service');
            loansService.updateLoanProgress(transaction.category_id, transaction.amount, true);
        }

        transactionsRepository.delete(id);
    }

    deleteFuture(id) {
        const transaction = this.findById(id);
        const related = transactionsRepository.findRelatedFixed(transaction);
        const allIds = [id, ...related.map(t => t.id)];

        // Revert loan progress for any paid transactions being deleted
        const loansService = require('./loans.service');
        const allTransactions = [transaction, ...related];
        allTransactions.forEach(t => {
            if (t.status === 'pago') {
                loansService.updateLoanProgress(t.category_id, t.amount, true);
            }
        });

        transactionsRepository.deleteMany(allIds);
        return { deleted: allIds.length };
    }

    updateFuture(id, data) {
        const transaction = this.findById(id);

        // Update the current transaction normally
        const updated = this.update(id, data);

        // Update related future fixed transactions (only safe fields)
        const related = transactionsRepository.findRelatedFixed(transaction);
        if (related.length > 0) {
            const bulkData = {};
            if (data.credit_card_id !== undefined) bulkData.credit_card_id = data.credit_card_id;
            if (data.account_id !== undefined) bulkData.account_id = data.account_id;
            if (data.category_id !== undefined) bulkData.category_id = data.category_id;
            if (data.amount !== undefined) bulkData.amount = data.amount;
            if (data.description !== undefined) bulkData.description = data.description;

            if (Object.keys(bulkData).length > 0) {
                transactionsRepository.updateMany(related.map(t => t.id), bulkData);
            }
        }

        return { updated: updated, affected: related.length + 1 };
    }

    _createInstallments(data) {
        const transactions = [];
        const baseCompetence = data.competence;

        for (let i = 0; i < data.installment_total; i++) {
            const competence = this._addMonths(baseCompetence, i);
            const dueDate = data.due_date
                ? this._addMonthsToDate(data.due_date, i)
                : null;

            transactions.push({
                ...data,
                description: `${data.description} (${i + 1}/${data.installment_total})`,
                competence,
                due_date: dueDate,
                status: i === 0 ? (data.status || 'previsto') : 'previsto',
                installment_number: i + 1,
                installment_total: data.installment_total
            });
        }

        const ids = transactionsRepository.createMany(transactions);
        return ids.map(id => transactionsRepository.findById(id));
    }

    _createFixed(data) {
        const transactions = [];

        for (let i = 0; i < 12; i++) {
            const competence = this._addMonths(data.competence, i);
            const dueDate = data.due_date
                ? this._addMonthsToDate(data.due_date, i)
                : null;

            transactions.push({
                ...data,
                competence,
                due_date: dueDate,
                status: i === 0 ? (data.status || 'previsto') : 'previsto'
            });
        }

        const ids = transactionsRepository.createMany(transactions);
        return ids.map(id => transactionsRepository.findById(id));
    }

    _addMonths(competence, months) {
        const [year, month] = competence.split('-').map(Number);
        const date = new Date(year, month - 1 + months, 1);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    }

    _addMonthsToDate(dateStr, months) {
        const date = new Date(dateStr);
        date.setMonth(date.getMonth() + months);
        return date.toISOString().split('T')[0];
    }
}

module.exports = new TransactionsService();
