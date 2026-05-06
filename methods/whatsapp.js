const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { registrarContacto } = require('../models/Contacto');
const { registrarSeleccion } = require('../models/Seleccion');

const OPCIONES = {
  '1': 'Consume Hidalgo',
  '2': 'Transformando con la Juventud',
  '3': 'Tu Experiencia Transforma',
  '4': 'Impulso Nafin',
  '5': 'Inclusión Financiera'
};

const MENU =
  `¿Qué información necesitas?\n\n` +
  `1️⃣ Consume Hidalgo\n` +
  `2️⃣ Transformando con la Juventud\n` +
  `3️⃣ Tu Experiencia Transforma\n` +
  `4️⃣ Impulso Nafin\n` +
  `5️⃣ Inclusión Financiera\n\n` +
  `Responde con el número de tu opción.\n` +
  `_(Escribe /menu en cualquier momento para ver estas opciones de nuevo)_`;

const state = {
  qrCodeData: null,
  isReady: false,
  clientInfo: null,
  mensajes: []
};

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './session' }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

client.on('qr', async (qr) => {
  state.isReady = false;
  try {
    state.qrCodeData = await qrcode.toDataURL(qr);
    console.log('[WA] QR generado');
  } catch (err) {
    console.error('[WA] Error generando QR:', err);
  }
});

client.on('authenticated', () => {
  console.log('[WA] Sesión autenticada');
  state.qrCodeData = null;
});

client.on('ready', () => {
  state.isReady = true;
  state.qrCodeData = null;
  state.clientInfo = client.info;
  console.log(`[WA] Conectado como: ${state.clientInfo.pushname} (${state.clientInfo.wid.user})`);
});

client.on('auth_failure', (msg) => {
  console.error('[WA] Error de autenticación:', msg);
  state.isReady = false;
});

client.on('disconnected', (reason) => {
  console.log('[WA] Desconectado:', reason);
  state.isReady = false;
  state.clientInfo = null;
});

client.on('message', async (msg) => {
  const contact = await msg.getContact();
  const chat    = await msg.getChat();

  const nombre = contact.pushname || contact.name || null;
  const numero = msg.from.replace('@c.us', '').replace('@g.us', '');

  // Guardar en memoria
  state.mensajes.unshift({
    id:        msg.id.id,
    timestamp: new Date(msg.timestamp * 1000).toISOString(),
    de:        nombre || numero,
    numero,
    esGrupo:   chat.isGroup,
    grupo:     chat.isGroup ? chat.name : null,
    mensaje:   msg.body,
    tipo:      msg.type
  });
  if (state.mensajes.length > 100) state.mensajes.pop();

  const origen = chat.isGroup ? `[${chat.name}] ${nombre || numero}` : (nombre || numero);
  console.log(`[MSG] ${origen}: ${msg.body}`);

  if (chat.isGroup) return;

  const seleccion = msg.body.trim();

  // Comando /menu
  if (seleccion.toLowerCase() === '/menu') {
    await msg.reply(MENU);
    return;
  }

  // Detectar selección de opción del menú
  if (OPCIONES[seleccion]) {
    await msg.reply(`Has seleccionado: *${OPCIONES[seleccion]}*`);
    try {
      await registrarSeleccion(numero, parseInt(seleccion), OPCIONES[seleccion]);
      console.log(`[SELECCION] +${numero} → opción ${seleccion}: ${OPCIONES[seleccion]}`);
    } catch (err) {
      console.error('[DB] Error registrando selección:', err.message);
    }
    return;
  }

  // Registrar contacto y enviar bienvenida si es nuevo, o menú si es existente
  try {
    const { nuevo } = await registrarContacto(numero, nombre);

    if (nuevo) {
      console.log(`[NUEVO CONTACTO] +${numero} (${nombre || 'sin nombre'})`);
      const saludo = nombre ? `¡Hola, ${nombre}!` : '¡Hola!';
      await msg.reply(`${saludo} Bienvenido/a. Estamos encantados de atenderte. 😊`);
      setTimeout(() => client.sendMessage(msg.from, MENU), 5000);
    } else {
      await msg.reply(`❌ La opción que seleccionaste no es válida.\n\n${MENU}`);
    }
  } catch (err) {
    console.error('[DB] Error registrando contacto:', err.message);
  }
});

module.exports = { client, state };
