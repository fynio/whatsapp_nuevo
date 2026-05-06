const { Router } = require('express');
const { obtenerContactos, contarContactos } = require('../models/Contacto');
const { obtenerSeleccionesContacto } = require('../models/Seleccion');

const router = Router();

router.get('/contactos', async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;
    const [contactos, total] = await Promise.all([
      obtenerContactos({ limit, offset }),
      contarContactos()
    ]);
    res.json({ total, limit, offset, contactos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/contactos/:numero/selecciones', async (req, res) => {
  try {
    const rows = await obtenerSeleccionesContacto(req.params.numero);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
