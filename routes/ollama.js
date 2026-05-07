const { Router } = require('express');

const router = Router();

router.get('/ollama', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Conectar con Ollama</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f2f5; }
        .card { background: white; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 2px 20px rgba(0,0,0,0.1); max-width: 440px; width: 90%; }
        .icon { font-size: 56px; }
        h1 { color: #e8410b; margin: 10px 0; }
        p { color: #666; font-size: 14px; }
        .form-group { text-align: left; margin-top: 20px; }
        label { font-size: 13px; color: #444; font-weight: bold; display: block; margin-bottom: 6px; }
        input, select { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
        .btn { display: block; width: 100%; margin-top: 24px; padding: 12px; background: #e8410b; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
        .btn:hover { background: #c23509; }
        .back { display: inline-block; margin-top: 16px; font-size: 13px; color: #128C7E; text-decoration: none; }
        .back:hover { text-decoration: underline; }
        #result { margin-top: 20px; padding: 12px; border-radius: 8px; font-size: 14px; display: none; }
        .ok { background: #e6f9ee; color: #1a7a3f; border: 1px solid #b2dfca; }
        .err { background: #fdecea; color: #c0392b; border: 1px solid #f5c2bb; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">🦙</div>
        <h1>Conectar con Ollama</h1>
        <p>Configura la URL y el modelo de Ollama para integrar IA con WhatsApp.</p>

        <div class="form-group">
          <label for="url">URL de Ollama</label>
          <input type="text" id="url" value="http://localhost:11434" placeholder="http://localhost:11434">
        </div>

        <div class="form-group">
          <label for="model">Modelo</label>
          <input type="text" id="model" value="llama3.2" placeholder="llama3.2, mistral, phi3...">
        </div>

        <button class="btn" onclick="probarConexion()">🔌 Probar conexión</button>
        <div id="result"></div>
        <a href="/" class="back">← Volver al inicio</a>
      </div>

      <script>
        async function probarConexion() {
          const url = document.getElementById('url').value.trim();
          const model = document.getElementById('model').value.trim();
          const result = document.getElementById('result');
          result.style.display = 'block';
          result.className = '';
          result.textContent = 'Probando conexión...';
          try {
            const res = await fetch('/ollama/test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url, model })
            });
            const data = await res.json();
            if (res.ok) {
              result.className = 'ok';
              result.textContent = '✅ ' + data.message;
            } else {
              result.className = 'err';
              result.textContent = '❌ ' + data.error;
            }
          } catch (e) {
            result.className = 'err';
            result.textContent = '❌ No se pudo conectar: ' + e.message;
          }
        }
      </script>
    </body>
    </html>
  `);
});

router.post('/ollama/test', async (req, res) => {
  const { url, model } = req.body;
  if (!url || !model) return res.status(400).json({ error: 'URL y modelo son requeridos' });

  try {
    const response = await fetch(`${url}/api/tags`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const modelos = (data.models || []).map(m => m.name);
    const encontrado = modelos.some(m => m.startsWith(model));
    if (encontrado) {
      return res.json({ message: `Conexión exitosa. Modelo "${model}" disponible.` });
    }
    return res.json({ message: `Conexión exitosa. Modelos disponibles: ${modelos.join(', ') || 'ninguno'}` });
  } catch (err) {
    return res.status(502).json({ error: `No se pudo alcanzar Ollama: ${err.message}` });
  }
});

module.exports = router;
