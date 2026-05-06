const { Router } = require('express');
const { obtenerEstadisticas } = require('../models/Seleccion');

const router = Router();

router.get('/estadisticas', async (req, res) => {
  try {
    res.json(await obtenerEstadisticas());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
