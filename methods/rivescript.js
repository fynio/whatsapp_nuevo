const RiveScript = require('rivescript');
const path = require('path');

let bot = null;

// Controla si RiveScript está activo. Cambia RIVESCRIPT_ENABLED en .env y reinicia.
const enabled = (process.env.RIVESCRIPT_ENABLED ?? 'true').toLowerCase() !== 'false';

async function initRiveScript() {
  bot = new RiveScript({ utf8: true });
  await bot.loadDirectory(path.join(__dirname, '../brain'));
  bot.sortReplies();
  console.log(`[RIVE] RiveScript inicializado — estado: ${enabled ? 'ACTIVO' : 'INACTIVO'}`);
}

// Devuelve la respuesta de RiveScript o null si está apagado / sin match.
async function riveReply(userId, message) {
  if (!bot || !enabled) return null;
  try {
    const reply = await bot.reply(String(userId), message);
    if (!reply || reply.startsWith('ERR:')) return null;
    return reply;
  } catch {
    return null;
  }
}

module.exports = { initRiveScript, riveReply };
