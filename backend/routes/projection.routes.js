const express = require('express');
const router = express.Router();
const projectionService = require('../services/projection.service');

router.get('/', (req, res, next) => {
    try {
        const months = parseInt(req.query.months) || 12;
        const projection = projectionService.getProjection(months);
        res.json(projection);
    } catch (err) { next(err); }
});

module.exports = router;
