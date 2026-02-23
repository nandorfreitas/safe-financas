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
            return {
                ...card,
                invoice_total: invoice.total,
                available: card.limit_total - invoice.total
            };
        });
    }
}

module.exports = new CreditCardsService();
