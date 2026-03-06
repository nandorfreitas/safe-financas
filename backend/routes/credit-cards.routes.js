const express = require('express');
const router = express.Router();
const creditCardsService = require('../services/credit-cards.service');

router.get('/', (req, res, next) => {
    try {
        const cards = creditCardsService.findAll();
        res.json(cards);
    } catch (err) { next(err); }
});

router.get('/with-invoices', (req, res, next) => {
    try {
        const competence = req.query.competence || new Date().toISOString().slice(0, 7);
        const cards = creditCardsService.getAllInvoices(competence);
        res.json(cards);
    } catch (err) { next(err); }
});

router.get('/:id', (req, res, next) => {
    try {
        const card = creditCardsService.findById(req.params.id);
        res.json(card);
    } catch (err) { next(err); }
});

router.get('/:id/invoice/:competence', (req, res, next) => {
    try {
        const invoice = creditCardsService.getInvoice(req.params.id, req.params.competence);
        res.json(invoice);
    } catch (err) { next(err); }
});

router.get('/:id/projections', (req, res, next) => {
    try {
        const months = req.query.months ? parseInt(req.query.months) : 6;
        const projections = creditCardsService.getProjections(req.params.id, months);
        res.json(projections);
    } catch (err) { next(err); }
});

router.post('/', (req, res, next) => {
    try {
        const card = creditCardsService.create(req.body);
        res.status(201).json(card);
    } catch (err) { next(err); }
});

router.put('/:id', (req, res, next) => {
    try {
        const card = creditCardsService.update(req.params.id, req.body);
        res.json(card);
    } catch (err) { next(err); }
});

router.delete('/:id', (req, res, next) => {
    try {
        creditCardsService.delete(req.params.id);
        res.status(204).send();
    } catch (err) { next(err); }
});

module.exports = router;
