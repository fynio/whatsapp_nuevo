const { pool } = require('../db');

async function registrarSeleccion(numero, opcionNumero, opcionNombre) {
  await pool.execute(
    'INSERT INTO selecciones (numero, opcion_numero, opcion_nombre, fecha) VALUES (?, ?, ?, ?)',
    [numero, opcionNumero, opcionNombre, new Date()]
  );
}

async function obtenerEstadisticas() {
  const [porOpcion] = await pool.execute(`
    SELECT opcion_numero, opcion_nombre,
           COUNT(*) AS total_selecciones,
           COUNT(DISTINCT numero) AS usuarios_unicos
    FROM selecciones
    GROUP BY opcion_numero, opcion_nombre
    ORDER BY total_selecciones DESC
  `);

  const [porDia] = await pool.execute(`
    SELECT DATE(fecha) AS dia, opcion_nombre, COUNT(*) AS total
    FROM selecciones
    GROUP BY dia, opcion_numero, opcion_nombre
    ORDER BY dia DESC, total DESC
    LIMIT 50
  `);

  const [[{ total_selecciones }]] = await pool.execute(
    'SELECT COUNT(*) AS total_selecciones FROM selecciones'
  );

  return { total_selecciones, por_opcion: porOpcion, por_dia: porDia };
}

async function obtenerSeleccionesContacto(numero) {
  const [rows] = await pool.execute(
    'SELECT opcion_numero, opcion_nombre, fecha FROM selecciones WHERE numero = ? ORDER BY fecha DESC',
    [numero]
  );
  return rows;
}

module.exports = { registrarSeleccion, obtenerEstadisticas, obtenerSeleccionesContacto };
