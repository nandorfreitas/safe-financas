const creditCardsRepository = require('../repositories/credit-cards.repository');
const transactionsRepository = require('../repositories/transactions.repository');

class CreditCardsService {
    findAll() {
        return creditCardsRepository.findAll();
    }

    findById(id) {
        const card = creditCardsRepository.findById(id);
        if (!card) throw { status: 404, message: 'Credit card not found' };
        return card;
    }

    findActive() {
        return creditCardsRepository.findActive();
    }

    create(data) {
        return creditCardsRepository.create(data);
    }

    update(id, data) {
        this.findById(id);
        return creditCardsRepository.update(id, data);
    }

    delete(id) {
        this.findById(id);
        creditCardsRepository.delete(id);
    }

    getInvoice(creditCardId, competence) {
        const card = this.findById(creditCardId);
        const invoice = transactionsRepository.getCreditCardInvoice(creditCardId, competence);
        const transactions = transactionsRepository.findAll({
            credit_card_id: creditCardId,
            competence
        });

        return {
            card,
            competence,
            total: invoice.total,
            transactions
        };
    }

    getAllInvoices(competence) {
        const cards = creditCardsRepository.findActive();
        return cards.map(card => {
            const invoice = transactionsRepository.getCreditCardInvoice(card.id, competence);
            const projections = this.getProjections(card.id);
            return {
                ...card,
                invoice_total: invoice.total,
                projections
            };
        });
    }

    getProjections(creditCardId, months = 6) {
        this.findById(creditCardId); // ensure card exists
        const projections = [];

        let currentDate = new Date();
        // Start from next month
        currentDate.setMonth(currentDate.getMonth() + 1);

        for (let i = 0; i < months; i++) {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const competence = `${year}-${month}`;

            const invoice = transactionsRepository.getCreditCardInvoice(creditCardId, competence);

            if (invoice.total > 0) {
                projections.push({
                    competence,
                    total: invoice.total
                });
            }

            // advance 1 month
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        return projections;
    }

    payInvoice(creditCardId, competence, amount) {
        const card = this.findById(creditCardId);

        if (!card.payment_account_id) {
            throw { status: 400, message: 'Este cartão não possui conta de pagamento vinculada' };
        }

        const invoice = transactionsRepository.getCreditCardInvoice(creditCardId, competence);

        if (!invoice.total || invoice.total <= 0) {
            throw { status: 400, message: 'Nenhuma fatura pendente encontrada para esta competência' };
        }

        const amountToPay = amount ? parseFloat(amount) : invoice.total;

        if (amountToPay <= 0) {
            throw { status: 400, message: 'Valor do pagamento deve ser maior que zero' };
        }

        // Ensure the "Pagamento de Fatura" category exists
        const category = this._ensurePaymentCategory();

        // Format competence for description (e.g. "Mar/2026")
        const [year, month] = competence.split('-');
        const date = new Date(year, month - 1);
        const monthName = date.toLocaleString('pt-BR', { month: 'short' });
        const formattedMonth = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}/${year}`;

        const today = new Date().toISOString().split('T')[0];

        // Create the payment transaction
        const transaction = transactionsRepository.create({
            description: `Pagamento fatura ${card.name} - ${formattedMonth}`,
            amount: amountToPay,
            type: 'transferencia',
            category_id: null,
            account_id: card.payment_account_id,
            credit_card_id: creditCardId,
            launch_date: today,
            competence,
            due_date: today,
            status: 'pago',
            fixed: 0,
            installment_total: 1,
            installment_number: 1,
            subtype: null
        });

        return transaction;
    }

    _ensurePaymentCategory() {
        const { getDatabase } = require('../database/db');
        const db = getDatabase();

        let category = db.prepare(
            "SELECT * FROM categories WHERE name = 'Pagamento de Fatura' AND type = 'despesa'"
        ).get();

        if (!category) {
            const categoriesRepository = require('../repositories/categories.repository');
            category = categoriesRepository.create({
                name: 'Pagamento de Fatura',
                type: 'despesa',
                monthly_budget: null,
                essential: 0,
                parent_id: null
            });
        }

        return category;
    }
}

module.exports = new CreditCardsService();

