const { Router } = require('express');
const { state } = require('../methods/whatsapp');

const router = Router();

router.get('/messages', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  res.json(state.mensajes.slice(0, limit));
});

module.exports = router;
