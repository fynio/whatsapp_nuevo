require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'whatsapp',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: '+00:00'
});

async function initDB() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS contactos (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      numero         VARCHAR(25)  NOT NULL UNIQUE,
      nombre         VARCHAR(255),
      primer_mensaje DATETIME     NOT NULL,
      ultimo_mensaje DATETIME     NOT NULL,
      total_mensajes INT          NOT NULL DEFAULT 1
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS selecciones (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      numero        VARCHAR(25)  NOT NULL,
      opcion_numero TINYINT      NOT NULL,
      opcion_nombre VARCHAR(100) NOT NULL,
      fecha         DATETIME     NOT NULL,
      INDEX idx_numero (numero),
      INDEX idx_opcion (opcion_numero),
      CONSTRAINT fk_selecciones_contacto FOREIGN KEY (numero)
        REFERENCES contactos(numero) ON UPDATE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  console.log('[DB] Tablas listas');
}

module.exports = { pool, initDB };
