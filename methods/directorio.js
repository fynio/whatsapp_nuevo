const path = require('path');
const fs   = require('fs');

let _contactos = null;

function cargarContactos() {
  if (_contactos) return _contactos;
  _contactos = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../assets/json/directorio.json'), 'utf8')
  );
  return _contactos;
}

const PALABRAS_COMUNES = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'una', 'uno',
  'por', 'que', 'con', 'para', 'son', 'sus',
]);

function normalizar(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function partesNombre(nombreCompleto) {
  return normalizar(nombreCompleto)
    .split(/\s+/)
    .filter(p => p.length > 2 && !PALABRAS_COMUNES.has(p));
}

// Patrones que indican intención de consultar un contacto
const INTENT_RE = [
  /\bcontacto\s+del?\b/i,
  /\bextensi[oó]n\s+del?\b/i,
  /\bdatos\s+del?\b/i,
  /\bcorreo\s+del?\b/i,
  /\bemail\s+del?\b/i,
  /\btel[eé]fono\s+del?\b/i,
  /\binformaci[oó]n\s+del?\b/i,
  /\bdirectorio\b/i,
  /\bbusc[ao]r?\s+(a\s+)?\w/i,
  /\bqui[eé]n\s+es\b/i,
  /\bc[oó]mo\s+(me\s+)?contact/i,
];

function tieneIntencion(texto) {
  return INTENT_RE.some(re => re.test(texto));
}

function buscarContacto(texto) {
  const norm = normalizar(texto);
  const lista = cargarContactos();

  return lista.filter(c => {
    const partes = partesNombre(c.nombre);
    const hits   = partes.filter(p => norm.includes(p));
    // Con intención basta 1 parte; sin ella se exigen 2 (evita falsos positivos)
    return tieneIntencion(texto) ? hits.length >= 1 : hits.length >= 2;
  });
}

function formatearContacto(c) {
  const lines = [`👤 *${c.nombre}*`];
  if (c.cargo)     lines.push(`📋 ${c.cargo}`);
  if (c.extension) lines.push(`☎️ Ext. ${c.extension}`);
  if (c.correo)    lines.push(`📧 ${c.correo}`);
  return lines.join('\n');
}

// Detecta "extensión 153", "ext 153", "ext. 153", "extensión número 153", etc.
const EXT_NUM_RE = /\bextensi[oó]n\s*(?:n[uú]mero\s*)?(\d{2,4})\b|\bext\.?\s+(\d{2,4})\b/i;

function buscarPorExtension(numero) {
  return cargarContactos().filter(c => c.extension === String(numero));
}

/**
 * Devuelve una respuesta lista para enviar, o null si no aplica.
 */
function consultarDirectorio(texto) {
  const norm = normalizar(texto);

  // "directorio" solo → instrucciones de uso
  if (/^\s*directorio\s*$/.test(norm)) {
    return (
      '📋 *Directorio SEDECO*\n' +
      'Puedo buscar el contacto de cualquier persona.\n' +
      'Ejemplo: "contacto de Paulina Galván" o "extensión de Rodrigo García"\n' +
      'También puedes preguntar: "¿de quién es la extensión 153?"'
    );
  }

  // Búsqueda por número de extensión: "de quién es la extensión 153"
  const extMatch = texto.match(EXT_NUM_RE);
  if (extMatch) {
    const numero = extMatch[1] || extMatch[2];
    const resultados = buscarPorExtension(numero);
    if (resultados.length > 0) {
      return resultados.map(formatearContacto).join('\n\n');
    }
    return `❌ No encontré ningún contacto con la extensión *${numero}*.`;
  }

  if (!tieneIntencion(texto)) return null;

  const resultados = buscarContacto(texto);
  if (resultados.length === 0) return null;

  return resultados.slice(0, 5).map(formatearContacto).join('\n\n');
}

module.exports = { consultarDirectorio };
