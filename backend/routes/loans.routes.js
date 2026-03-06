const express = require('express');
const router = express.Router();
const loansService = require('../services/loans.service');

router.get('/', (req, res, next) => {
    try {
        const loans = loansService.findAll();
        res.json(loans);
    } catch (err) { next(err); }
});

router.get('/:id', (req, res, next) => {
    try {
        const loan = loansService.findById(req.params.id);
        res.json(loan);
    } catch (err) { next(err); }
});

router.post('/', (req, res, next) => {
    try {
        const loan = loansService.create(req.body);
        res.status(201).json(loan);
    } catch (err) { next(err); }
});

router.put('/:id', (req, res, next) => {
    try {
        const loan = loansService.update(req.params.id, req.body);
        res.json(loan);
    } catch (err) { next(err); }
});

router.delete('/:id', (req, res, next) => {
    try {
        loansService.delete(req.params.id);
        res.status(204).send();
    } catch (err) { next(err); }
});

module.exports = router;
