const express = require('express');
const router = express.Router();
const geminiService = require('../services/gemini.service');

// Process chat message
router.post('/', async (req, res, next) => {
  try {
    const { session_id, message } = req.body;

    if (!session_id || !message) {
      return res.status(400).json({ error: 'Campos "session_id" e "message" são obrigatórios' });
    }

    const result = await geminiService.processMessage(session_id, message.trim());
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Clear chat session
router.delete('/:sessionId', (req, res) => {
  geminiService.clearSession(req.params.sessionId);
  res.json({ ok: true });
});

module.exports = router;
