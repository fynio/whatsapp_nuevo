const { Router } = require('express');
const { state } = require('../methods/whatsapp');

const router = Router();

router.get('/', (req, res) => {
  if (state.isReady) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WhatsApp Conectado</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f2f5; }
          .card { background: white; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 2px 20px rgba(0,0,0,0.1); max-width: 400px; width: 90%; }
          .status { color: #25D366; font-size: 48px; }
          h1 { color: #128C7E; margin: 10px 0; }
          .info { background: #f0f2f5; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 14px; color: #333; }
          p { color: #999; font-size: 13px; margin-top: 20px; }
          .btn-ollama { display: inline-block; margin-top: 24px; padding: 12px 28px; background: #e8410b; color: white; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: bold; transition: background 0.2s; }
          .btn-ollama:hover { background: #c23509; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="status">✅</div>
          <h1>WhatsApp Conectado</h1>
          <div class="info">
            <strong>${state.clientInfo?.pushname || 'Usuario'}</strong><br>
            +${state.clientInfo?.wid?.user || ''}
          </div>
          <p>La sesión está guardada. No necesitas escanear el QR de nuevo.</p>
          <a href="/ollama" class="btn-ollama">🦙 Conectar con Ollama</a>
        </div>
      </body>
      </html>
    `);
  }

  if (state.qrCodeData) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Escanea el QR - WhatsApp</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f2f5; }
          .card { background: white; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 2px 20px rgba(0,0,0,0.1); max-width: 420px; width: 90%; }
          h1 { color: #128C7E; margin-bottom: 8px; }
          p { color: #666; font-size: 14px; margin-bottom: 24px; }
          img { width: 280px; height: 280px; border: 2px solid #eee; border-radius: 8px; }
          .refresh { margin-top: 20px; font-size: 13px; color: #999; }
          .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #f90; margin-right: 6px; }
        </style>
        <meta http-equiv="refresh" content="30">
      </head>
      <body>
        <div class="card">
          <h1>Conectar WhatsApp</h1>
          <p><span class="dot"></span>Escanea este código QR con tu teléfono</p>
          <img src="${state.qrCodeData}" alt="QR Code WhatsApp">
          <div class="refresh">Esta página se actualiza cada 30 segundos</div>
        </div>
      </body>
      </html>
    `);
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Iniciando...</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f2f5; }
        .card { background: white; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 2px 20px rgba(0,0,0,0.1); }
        h1 { color: #128C7E; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f0f2f5; border-top: 4px solid #25D366; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
      <meta http-equiv="refresh" content="3">
    </head>
    <body>
      <div class="card">
        <div class="spinner"></div>
        <h1>Iniciando cliente...</h1>
        <p>Por favor espera, esto puede tomar unos segundos.</p>
      </div>
    </body>
    </html>
  `);
});

module.exports = router;
