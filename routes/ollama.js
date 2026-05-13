const { Router } = require('express');

const router = Router();

const AI_PROVIDER  = (process.env.AI_PROVIDER  || 'ollama').toLowerCase();
const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

router.get('/ollama', (req, res) => {
  const activeOllama = AI_PROVIDER === 'ollama';
  const activeGemini = AI_PROVIDER === 'gemini';

  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Configuración de IA</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; margin: 0; padding: 24px 0; background: #f0f2f5; }
        .card { background: white; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 2px 20px rgba(0,0,0,0.1); max-width: 480px; width: 90%; }
        h1 { color: #333; margin: 10px 0; font-size: 22px; }
        p  { color: #666; font-size: 14px; margin-bottom: 0; }
        .badge { display: inline-block; margin: 10px auto 4px; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; }
        .badge-ollama { background: #fff3e0; color: #e8410b; border: 1px solid #f8c99b; }
        .badge-gemini { background: #e8f0fe; color: #1a73e8; border: 1px solid #a8c7fa; }
        .tabs { display: flex; border-bottom: 2px solid #eee; margin: 24px 0 20px; }
        .tab { flex: 1; padding: 10px; cursor: pointer; font-size: 14px; font-weight: bold; color: #888; border: none; background: none; border-bottom: 3px solid transparent; margin-bottom: -2px; transition: color 0.2s; }
        .tab.active { color: #1a73e8; border-bottom-color: #1a73e8; }
        .panel { display: none; text-align: left; }
        .panel.active { display: block; }
        .form-group { margin-top: 16px; }
        label { font-size: 13px; color: #444; font-weight: bold; display: block; margin-bottom: 6px; }
        input, select { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
        .btn-ollama { display: block; width: 100%; margin-top: 20px; padding: 12px; background: #e8410b; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
        .btn-ollama:hover { background: #c23509; }
        .btn-gemini { display: block; width: 100%; margin-top: 20px; padding: 12px; background: #1a73e8; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
        .btn-gemini:hover { background: #1558b0; }
        .back { display: inline-block; margin-top: 20px; font-size: 13px; color: #128C7E; text-decoration: none; }
        .back:hover { text-decoration: underline; }
        #result-ollama, #result-gemini { margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 14px; display: none; }
        .ok  { background: #e6f9ee; color: #1a7a3f; border: 1px solid #b2dfca; }
        .err { background: #fdecea; color: #c0392b; border: 1px solid #f5c2bb; }
        .env-hint { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; margin-top: 18px; font-size: 12px; color: #555; text-align: left; }
        .env-hint code { font-family: monospace; background: #eee; padding: 1px 4px; border-radius: 3px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div style="font-size:48px">${activeGemini ? '✨' : '🦙'}</div>
        <h1>Configuración de IA</h1>
        <div class="badge ${activeGemini ? 'badge-gemini' : 'badge-ollama'}">
          Proveedor activo: ${activeGemini ? `Gemini (${GEMINI_MODEL})` : `Ollama (${OLLAMA_MODEL})`}
        </div>
        <p>Cambia el proveedor editando <code>.env</code> y reiniciando el servidor.</p>

        <div class="tabs">
          <button class="tab ${activeOllama ? 'active' : ''}" onclick="switchTab('ollama')">🦙 Ollama</button>
          <button class="tab ${activeGemini ? 'active' : ''}" onclick="switchTab('gemini')">✨ Gemini</button>
        </div>

        <!-- Panel Ollama -->
        <div id="panel-ollama" class="panel ${activeOllama ? 'active' : ''}">
          <div class="form-group">
            <label for="url">URL de Ollama</label>
            <input type="text" id="url" value="${OLLAMA_URL}" placeholder="http://localhost:11434">
          </div>
          <div class="form-group">
            <label for="model">Modelo</label>
            <input type="text" id="model" value="${OLLAMA_MODEL}" placeholder="llama3.2, mistral, phi3...">
          </div>
          <button class="btn-ollama" onclick="probarOllama()">🔌 Probar conexión</button>
          <div id="result-ollama"></div>
          <div class="env-hint">
            Configura en <code>.env</code>:<br>
            <code>AI_PROVIDER=ollama</code><br>
            <code>OLLAMA_URL=http://localhost:11434</code><br>
            <code>OLLAMA_MODEL=llama3.2</code>
          </div>
        </div>

        <!-- Panel Gemini -->
        <div id="panel-gemini" class="panel ${activeGemini ? 'active' : ''}">
          <div class="form-group">
            <label for="gemini-key">API Key de Gemini</label>
            <input type="password" id="gemini-key" placeholder="AIza...">
          </div>
          <div class="form-group">
            <label for="gemini-model">Modelo</label>
            <input type="text" id="gemini-model" value="${GEMINI_MODEL}" placeholder="gemini-1.5-flash, gemini-1.5-pro...">
          </div>
          <button class="btn-gemini" onclick="probarGemini()">🔌 Probar conexión</button>
          <div id="result-gemini"></div>
          <div class="env-hint">
            Configura en <code>.env</code>:<br>
            <code>AI_PROVIDER=gemini</code><br>
            <code>GEMINI_API_KEY=tu-api-key</code><br>
            <code>GEMINI_MODEL=gemini-1.5-flash</code>
          </div>
        </div>

        <a href="/" class="back">← Volver al inicio</a>
      </div>

      <script>
        function switchTab(name) {
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
          document.querySelector('#panel-' + name).classList.add('active');
          event.target.classList.add('active');
        }

        async function probarOllama() {
          const url   = document.getElementById('url').value.trim();
          const model = document.getElementById('model').value.trim();
          const result = document.getElementById('result-ollama');
          result.style.display = 'block';
          result.className = '';
          result.textContent = 'Probando conexión...';
          try {
            const res  = await fetch('/ollama/test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url, model })
            });
            const data = await res.json();
            result.className = res.ok ? 'ok' : 'err';
            result.textContent = (res.ok ? '✅ ' : '❌ ') + (data.message || data.error);
          } catch (e) {
            result.className = 'err';
            result.textContent = '❌ No se pudo conectar: ' + e.message;
          }
        }

        async function probarGemini() {
          const apiKey = document.getElementById('gemini-key').value.trim();
          const model  = document.getElementById('gemini-model').value.trim();
          const result = document.getElementById('result-gemini');
          result.style.display = 'block';
          result.className = '';
          result.textContent = 'Probando conexión...';
          try {
            const res  = await fetch('/gemini/test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ apiKey, model })
            });
            const data = await res.json();
            result.className = res.ok ? 'ok' : 'err';
            result.textContent = (res.ok ? '✅ ' : '❌ ') + (data.message || data.error);
          } catch (e) {
            result.className = 'err';
            result.textContent = '❌ Error: ' + e.message;
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

router.post('/gemini/test', async (req, res) => {
  const { apiKey, model } = req.body;
  if (!apiKey || !model) return res.status(400).json({ error: 'API Key y modelo son requeridos' });

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const gemModel = genAI.getGenerativeModel({ model });
    const result = await gemModel.generateContent('Responde solo: ok');
    const text = result.response.text();
    return res.json({ message: `Conexión exitosa con ${model}. Respuesta: "${text.trim()}"` });
  } catch (err) {
    return res.status(502).json({ error: `Error con Gemini: ${err.message}` });
  }
});

module.exports = router;
