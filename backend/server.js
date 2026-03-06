const express = require('express');
const cors = require('cors');
const path = require('path');

const { getDatabase, closeDatabase } = require('./database/db');

const accountsRoutes = require('./routes/accounts.routes');
const creditCardsRoutes = require('./routes/credit-cards.routes');
const categoriesRoutes = require('./routes/categories.routes');
const transactionsRoutes = require('./routes/transactions.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const projectionRoutes = require('./routes/projection.routes');
const loansRoutes = require('./routes/loans.routes');
const backupRoutes = require('./routes/backup.routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
getDatabase();

// Routes
app.use('/api/accounts', accountsRoutes);
app.use('/api/credit-cards', creditCardsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projection', projectionRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/backup', backupRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

app.listen(PORT, () => {
    console.log(`SAFE Finanças API running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    closeDatabase();
    process.exit(0);
});

process.on('SIGTERM', () => {
    closeDatabase();
    process.exit(0);
});
