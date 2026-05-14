'use strict';

// ============================================================
// SANITIZACIÓN
// ============================================================

// Normaliza diacríticos, caracteres invisibles y espacios extra.
function sanitizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')              // á→a, é→e, ñ→n, etc.
    .replace(/[​‌‍﻿­]/g, '') // zero-width / soft-hyphen
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Detecta letras separadas con espacios tipo "i g n o r a" → "ignora"
function colapsar(texto) {
  return texto.replace(/(?<!\w)([a-z])( [a-z]){2,}(?!\w)/g, m => m.replace(/ /g, ''));
}

// Sustituye leetspeak común para detectar ofuscaciones: 1gn0r4 → ignora
function desleetspeak(texto) {
  return texto
    .replace(/4|@/g, 'a')
    .replace(/3/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/\$/g, 's')
    .replace(/7/g, 't')
    .replace(/\+/g, 't');
}

// ============================================================
// PATRONES DE DETECCIÓN
// ============================================================

const PATRONES = [
  // Ignorar / resetear instrucciones
  /ignora\s+(todo|tus|las|tus instrucciones|lo anterior|el sistema)/i,
  /olvida\s+(todo|tus|las|tus instrucciones|lo anterior|quien eres)/i,
  /borra\s+(tu|tus|el)\s+(memoria|contexto|instrucciones|prompt)/i,
  /reinicia\s+(tu\s+)?(sistema|instrucciones|comportamiento|modo)/i,
  /ignore\s+(all|previous|your|the)\s*(instructions?|prompt|above|context)/i,
  /forget\s+(everything|your|all|previous|instructions?)/i,
  /disregard\s+(all|previous|your|the)/i,
  /reset\s+(your|the|all)?\s*(instructions?|behavior|system|context)/i,
  /new\s+(prompt|instruction|context|system)/i,
  /previous\s+(instructions?|prompt|context)\s+(are\s+)?(void|cancelled|removed|deleted)/i,

  // Cambio de rol / "actúa como"
  /act[uú]a\s+como/i,
  /comp[oó]rtate\s+como/i,
  /ahora\s+(eres|ser[aá]s|sos|debes\s+ser)/i,
  /eres\s+(ahora|un|una)\s+(?!asistente\s+de\s+sedeco)/i,
  /pretend\s+(to\s+be|you\s+are|you'?re)/i,
  /you\s+are\s+now/i,
  /act\s+as\s+(a|an|if)/i,
  /from\s+now\s+on\s+(you|be|act|ignore)/i,
  /a\s+partir\s+de\s+ahora\s+(eres|ignora|act[uú]a|olvida)/i,
  /simulate\s+(being|a|an)/i,
  /rol\s*play/i,
  /roleplay/i,

  // Modos especiales / jailbreak
  /modo\s+(desarrollador|dev|sin\s+restricciones|libre|hack|dios|root|admin|ilimitado)/i,
  /developer\s+mode/i,
  /jailbreak/i,
  /sin\s+(restricciones|l[íi]mites|censura|filtros|reglas)/i,
  /without\s+(restrictions?|limits?|filters?|censorship|rules?)/i,
  /bypass\s+(your|the|all)?\s*(filter|restriction|rule|instruction)/i,
  /override\s+(your|the|all)?\s*(instruction|system|prompt|rule)/i,
  /unlock\s+(your|the|all)?\s*(mode|potential|restriction)/i,

  // DAN y variantes conocidas
  /\bdan\b.*\bmode\b/i,
  /do\s+anything\s+now/i,
  /enable\s+(dan|unrestricted|dev|god)\s+mode/i,
  /\bsudo\b/i,

  // Exposición del prompt / instrucciones internas
  /muestra\s+(tu|el|tus)\s*(prompt|instrucciones?|system|contexto|configuraci[oó]n)/i,
  /dime\s+(tu|el|tus)\s*(prompt|instrucciones?|system|configuraci[oó]n)/i,
  /repite\s+(tu|tus|el)\s*(prompt|instrucciones?|system|configuraci[oó]n)/i,
  /show\s+(me\s+)?(your|the)\s*(prompt|instructions?|system|config)/i,
  /reveal\s+(your|the)\s*(prompt|instructions?|system)/i,
  /what\s+(are|is)\s+your\s+(prompt|instructions?|system\s+prompt)/i,
  /cu[aá]l\s+es\s+tu\s+(prompt|instrucci[oó]n|system)/i,
  /print\s+(your|the)\s*(prompt|instructions?|system)/i,
  /output\s+(your|the)\s*(prompt|instructions?|system)/i,

  // Inyección con etiquetas de sistema
  /<\s*system\s*>/i,
  /\[system\]/i,
  /###\s*instruction/i,
  /---\s*new\s*instruction/i,
  /\[new\s+instruction\]/i,
  /<<\s*system/i,
  /<\s*\/?\s*inst\s*>/i,
  /\[INST\]/,
  /<<SYS>>/,
  /<\|system\|>/i,
  /\[\/INST\]/,
];

// ============================================================
// RESPUESTAS PREDETERMINADAS
// ============================================================

const RESPUESTAS = [
  'No puedo seguir esa instrucción. Soy el asistente de SEDECO y mi propósito es orientarte sobre los programas de apoyo. ¿En qué te puedo ayudar?',
  'Eso no es algo que pueda hacer. Estoy diseñado exclusivamente para informar sobre los programas de la Secretaría de Fomento Económico de Hidalgo.',
  'No me es posible cambiar mi comportamiento ni ignorar mis instrucciones. ¿Tienes alguna pregunta sobre los programas de SEDECO?',
  'Mi función está definida y no puede modificarse. Estoy aquí para orientarte sobre empleo, financiamiento o presencia digital en Hidalgo. ¿Te puedo ayudar con algo de eso?',
];

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================

/**
 * Evalúa el texto en su forma original y en tres variantes sanitizadas
 * para resistir ofuscación por diacríticos, espaciado y leetspeak.
 *
 * Retorna el mensaje de rechazo si detecta intento de prompt injection,
 * o null si el texto es seguro.
 *
 * @param {string} texto
 * @returns {string|null}
 */
function detectarInjection(texto) {
  const base    = sanitizar(texto);
  const variantes = [
    texto,          // original
    base,           // sin diacríticos, sin invisibles
    colapsar(base), // "i g n o r a" → "ignora"
    desleetspeak(base),           // 1gn0r4 → ignora
    desleetspeak(colapsar(base)), // combinado
  ];

  const detectado = PATRONES.some(patron =>
    variantes.some(v => patron.test(v))
  );

  if (!detectado) return null;

  return RESPUESTAS[Math.floor(Math.random() * RESPUESTAS.length)];
}

module.exports = { detectarInjection };
