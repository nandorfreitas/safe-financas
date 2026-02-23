const express = require('express');
const router = express.Router();
const accountsService = require('../services/accounts.service');

router.get('/', (req, res, next) => {
    try {
        const accounts = accountsService.findAll();
        res.json(accounts);
    } catch (err) { next(err); }
});

router.get('/balances', (req, res, next) => {
    try {
        const balances = accountsService.getAllBalances();
        res.json(balances);
    } catch (err) { next(err); }
});

router.get('/:id', (req, res, next) => {
    try {
        const account = accountsService.getBalance(req.params.id);
        res.json(account);
    } catch (err) { next(err); }
});

router.post('/', (req, res, next) => {
    try {
        const account = accountsService.create(req.body);
        res.status(201).json(account);
    } catch (err) { next(err); }
});

router.put('/:id', (req, res, next) => {
    try {
        const account = accountsService.update(req.params.id, req.body);
        res.json(account);
    } catch (err) { next(err); }
});

router.delete('/:id', (req, res, next) => {
    try {
        accountsService.delete(req.params.id);
        res.status(204).send();
    } catch (err) { next(err); }
});

module.exports = router;
