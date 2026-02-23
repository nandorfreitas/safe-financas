const express = require('express');
const router = express.Router();
const path = require('path');
const { DB_PATH } = require('../database/db');

router.get('/', (req, res, next) => {
    try {
        res.download(DB_PATH, 'finance.db');
    } catch (err) { next(err); }
});

module.exports = router;
