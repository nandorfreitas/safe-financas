const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboard.service');

router.get('/:competence', (req, res, next) => {
    try {
        const dashboard = dashboardService.getDashboard(req.params.competence);
        res.json(dashboard);
    } catch (err) { next(err); }
});

module.exports = router;
