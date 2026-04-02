const express = require('express');
const router = express.Router();
const importService = require('../services/import.service');

// Parse uploaded file (OFX or CSV)
router.post('/parse',
  express.raw({ type: 'application/octet-stream', limit: '10mb' }),
  async (req, res, next) => {
    try {
      const { format, context, target_id, competence, col_date, col_description, col_amount, col_type } = req.query;

      if (!format) {
        return res.status(400).json({ error: 'Parâmetro "format" é obrigatório (ofx ou csv)' });
      }
      if (!context || !target_id) {
        return res.status(400).json({ error: 'Parâmetros "context" e "target_id" são obrigatórios' });
      }
      if (!req.body || req.body.length === 0) {
        return res.status(400).json({ error: 'Arquivo não enviado' });
      }

      const result = await importService.parse(req.body, {
        format, context, target_id, competence,
        col_date, col_description, col_amount, col_type
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// Confirm and create transactions
router.post('/confirm', (req, res, next) => {
  try {
    const { context, target_id, competence, transactions } = req.body;

    if (!context || !target_id || !transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ error: 'Dados inválidos para confirmação' });
    }

    if (transactions.length === 0) {
      return res.status(400).json({ error: 'Nenhuma transação para importar' });
    }

    const result = importService.confirm({ context, target_id, competence, transactions });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
