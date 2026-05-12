const { Router } = require('express');
const { obtenerTodosChats, obtenerChatsContacto, contarChats } = require('../models/Chat');

const router = Router();

// GET /chats?limit=50&offset=0  — todos los chats paginados
router.get('/', async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit)  || 50, 200);
    const offset = parseInt(req.query.offset) || 0;
    const [rows, total] = await Promise.all([
      obtenerTodosChats({ limit, offset }),
      contarChats()
    ]);
    res.json({ total, limit, offset, chats: rows });
  } catch (err) {
    console.error('[API] Error /chats:', err.message);
    res.status(500).json({ error: 'Error al obtener chats' });
  }
});

// GET /chats/:numero  — historial de un contacto específico
router.get('/:numero', async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit)  || 50, 200);
    const offset = parseInt(req.query.offset) || 0;
    const rows   = await obtenerChatsContacto(req.params.numero, { limit, offset });
    res.json({ numero: req.params.numero, limit, offset, chats: rows });
  } catch (err) {
    console.error('[API] Error /chats/:numero:', err.message);
    res.status(500).json({ error: 'Error al obtener chats del contacto' });
  }
});

module.exports = router;
