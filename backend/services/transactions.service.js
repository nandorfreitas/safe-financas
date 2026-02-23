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

        // If installment purchase, generate all installments
        if (installment_total && installment_total > 1) {
            return this._createInstallments(data);
        }

        // If fixed expense, replicate for 12 months
        if (fixed) {
            return this._createFixed(data);
        }

        return transactionsRepository.create(data);
    }

    update(id, data) {
        this.findById(id);
        return transactionsRepository.update(id, data);
    }

    delete(id) {
        this.findById(id);
        transactionsRepository.delete(id);
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
