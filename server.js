require('dotenv').config();
const express = require('express');
const { initDB } = require('./db');
const { client } = require('./methods/whatsapp');
const { initRiveScript } = require('./methods/rivescript');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(routes);

initDB()
  .then(() => initRiveScript())
  .then(() => {
    app.listen(PORT, () => console.log(`[HTTP] Servidor en http://localhost:${PORT}`));
    client.initialize();
  })
  .catch((err) => {
    console.error('[DB] No se pudo conectar a MySQL:', err.message);
    process.exit(1);
  });
