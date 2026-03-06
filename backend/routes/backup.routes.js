const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { DB_PATH, closeDatabase, getDatabase } = require('../database/db');

// Export backup (download)
router.get('/', (req, res, next) => {
    try {
        res.download(DB_PATH, 'finance.db');
    } catch (err) { next(err); }
});

// Import backup (restore)
router.post('/restore', express.raw({ type: 'application/octet-stream', limit: '50mb' }), (req, res, next) => {
    try {
        if (!req.body || req.body.length === 0) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Validate it's a SQLite file (magic bytes: "SQLite format 3\0")
        const header = req.body.slice(0, 16).toString('utf-8');
        if (!header.startsWith('SQLite format 3')) {
            return res.status(400).json({ error: 'Invalid SQLite database file' });
        }

        // Create backup of current DB before replacing
        const backupPath = DB_PATH + '.bak';
        if (fs.existsSync(DB_PATH)) {
            fs.copyFileSync(DB_PATH, backupPath);
        }

        // Close current connection, write new file, reconnect
        closeDatabase();
        fs.writeFileSync(DB_PATH, req.body);
        getDatabase(); // reopen

        res.json({ success: true, message: 'Backup restored successfully' });
    } catch (err) {
        // Try to restore from backup if something went wrong
        const backupPath = DB_PATH + '.bak';
        if (fs.existsSync(backupPath)) {
            try {
                closeDatabase();
                fs.copyFileSync(backupPath, DB_PATH);
                getDatabase();
            } catch (restoreErr) {
                console.error('Failed to restore backup:', restoreErr);
            }
        }
        next(err);
    }
});

module.exports = router;
