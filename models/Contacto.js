const { pool } = require('../db');

async function registrarContacto(numero, nombre) {
  const ahora = new Date();
  const [result] = await pool.execute(
    `INSERT INTO contactos (numero, nombre, primer_mensaje, ultimo_mensaje, total_mensajes)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       nombre         = COALESCE(VALUES(nombre), nombre),
       ultimo_mensaje = VALUES(ultimo_mensaje),
       total_mensajes = total_mensajes + 1`,
    [numero, nombre || null, ahora, ahora]
  );
  // affectedRows: 1 = INSERT nuevo, 2 = UPDATE existente
  return { nuevo: result.affectedRows === 1 };
}

async function obtenerContactos({ limit = 50, offset = 0 } = {}) {
  const [rows] = await pool.execute(
    'SELECT * FROM contactos ORDER BY ultimo_mensaje DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
  return rows;
}

async function contarContactos() {
  const [[row]] = await pool.execute('SELECT COUNT(*) AS total FROM contactos');
  return row.total;
}

module.exports = { registrarContacto, obtenerContactos, contarContactos };
