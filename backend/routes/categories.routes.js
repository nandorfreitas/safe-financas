const express = require('express');
const router = express.Router();
const categoriesService = require('../services/categories.service');

router.get('/', (req, res, next) => {
    try {
        const categories = categoriesService.findAll();
        res.json(categories);
    } catch (err) { next(err); }
});

router.get('/budget/:competence', (req, res, next) => {
    try {
        const budget = categoriesService.getBudgetStatus(req.params.competence);
        res.json(budget);
    } catch (err) { next(err); }
});

router.get('/:id', (req, res, next) => {
    try {
        const category = categoriesService.findById(req.params.id);
        res.json(category);
    } catch (err) { next(err); }
});

router.post('/', (req, res, next) => {
    try {
        const category = categoriesService.create(req.body);
        res.status(201).json(category);
    } catch (err) { next(err); }
});

router.put('/:id', (req, res, next) => {
    try {
        const category = categoriesService.update(req.params.id, req.body);
        res.json(category);
    } catch (err) { next(err); }
});

router.delete('/:id', (req, res, next) => {
    try {
        categoriesService.delete(req.params.id);
        res.status(204).send();
    } catch (err) { next(err); }
});

module.exports = router;
