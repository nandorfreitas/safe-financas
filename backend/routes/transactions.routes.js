const express = require('express');
const router = express.Router();
const transactionsService = require('../services/transactions.service');

router.get('/', (req, res, next) => {
    try {
        const filters = {
            competence: req.query.competence,
            account_id: req.query.account_id,
            credit_card_id: req.query.credit_card_id,
            category_id: req.query.category_id,
            type: req.query.type,
            status: req.query.status
        };
        const transactions = transactionsService.findAll(filters);
        res.json(transactions);
    } catch (err) { next(err); }
});

router.get('/:id', (req, res, next) => {
    try {
        const transaction = transactionsService.findById(req.params.id);
        res.json(transaction);
    } catch (err) { next(err); }
});

router.post('/', (req, res, next) => {
    try {
        const result = transactionsService.create(req.body);
        res.status(201).json(result);
    } catch (err) { next(err); }
});

router.put('/:id', (req, res, next) => {
    try {
        const transaction = transactionsService.update(req.params.id, req.body);
        res.json(transaction);
    } catch (err) { next(err); }
});

router.delete('/:id', (req, res, next) => {
    try {
        transactionsService.delete(req.params.id);
        res.status(204).send();
    } catch (err) { next(err); }
});

module.exports = router;
