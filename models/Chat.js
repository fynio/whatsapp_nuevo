const { pool } = require('../db');

async function registrarChat(numero, pregunta, respuesta) {
  await pool.execute(
    'INSERT INTO chats (numero, pregunta, respuesta, fecha) VALUES (?, ?, ?, ?)',
    [numero, pregunta, respuesta || null, new Date()]
  );
}

async function obtenerChatsContacto(numero, { limit = 50, offset = 0 } = {}) {
  const [rows] = await pool.execute(
    'SELECT id, pregunta, respuesta, fecha FROM chats WHERE numero = ? ORDER BY fecha DESC LIMIT ? OFFSET ?',
    [numero, limit, offset]
  );
  return rows;
}

async function obtenerTodosChats({ limit = 50, offset = 0 } = {}) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.numero, co.nombre, c.pregunta, c.respuesta, c.fecha
     FROM chats c
     LEFT JOIN contactos co ON co.numero = c.numero
     ORDER BY c.fecha DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows;
}

async function contarChats() {
  const [[row]] = await pool.execute('SELECT COUNT(*) AS total FROM chats');
  return row.total;
}

module.exports = { registrarChat, obtenerChatsContacto, obtenerTodosChats, contarChats };
