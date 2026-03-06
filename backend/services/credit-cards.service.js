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
}

module.exports = new CreditCardsService();
