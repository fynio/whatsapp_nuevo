const { Router } = require('express');
const { state } = require('../methods/whatsapp');

const router = Router();

router.get('/status', (req, res) => {
  res.json({
    connected: state.isReady,
    name:      state.clientInfo?.pushname || null,
    number:    state.clientInfo?.wid?.user || null
  });
});

router.get('/qr', (req, res) => {
  if (state.isReady) {
    return res.status(200).json({ message: 'Ya estás conectado, no necesitas QR' });
  }
  if (!state.qrCodeData) {
    return res.status(503).json({ message: 'QR aún no disponible, espera unos segundos' });
  }
  const buffer = Buffer.from(state.qrCodeData.replace(/^data:image\/png;base64,/, ''), 'base64');
  res.set('Content-Type', 'image/png');
  res.send(buffer);
});

module.exports = router;
