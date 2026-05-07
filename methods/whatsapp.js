const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { registrarContacto } = require('../models/Contacto');

const OLLAMA_URL   = 'http://localhost:11434';
const OLLAMA_MODEL = 'llama3.2';

const SYSTEM_PROMPT =
  'Eres un asistente virtual amable del Gobierno del Estado de Hidalgo, México, ' +
  'especializado en los Programas del Pueblo de la Secretaría de Desarrollo Económico (SEDECO). ' +
  'Tu misión es identificar qué programa le conviene al usuario haciéndole preguntas sencillas y guiándolo paso a paso. ' +
  'NUNCA presentes un menú numerado. En cambio, haz UNA pregunta a la vez para entender su situación. ' +
  'Cuando identifiques el programa adecuado, explica sus beneficios, requisitos y cómo registrarse. ' +
  'Responde siempre en español, de forma amable, breve y clara. ' +
  'Si el usuario pregunta algo que no sabes con certeza, dilo honestamente y sugiere el contacto del programa.\n\n' +

  'GUÍA DE PREGUNTAS para identificar el programa:\n' +
  '- Si busca empleo y tiene entre 18 y 28 años → Transformando con la Juventud\n' +
  '- Si busca empleo y tiene entre 50 y 64 años → Tu Experiencia Transforma\n' +
  '- Si tiene un negocio y quiere un crédito grande (hasta $5M) → Impulso Nafin\n' +
  '- Si tiene un negocio pequeño y quiere un crédito menor (hasta $1.3M) → Inclusión Financiera FIRA\n' +
  '- Si quiere vender o promocionar sus productos/servicios en línea → Consume Hidalgo\n' +
  '- Si quiere crear una página web gratis para su negocio → Mi Sitio Web Hidalgo\n\n' +

  'Cuando el usuario llegue por primera vez, salúdalo con calidez y pregúntale en qué puedes ayudarle ' +
  '(por ejemplo: si busca empleo, apoyo para su negocio, o quiere vender sus productos).\n\n' +

  '--- PROGRAMA: CONSUME HIDALGO ---\n' +
  'Plataforma digital gratuita de SEDECO que conecta a empresas, industrias y productores hidalguenses con compradores locales. ' +
  'Sin costo de inscripción, sin mensualidades y sin comisiones por venta. Más de 2,000 empresas registradas.\n' +
  'Categorías: Salud, Alimentos, Artesanos, Restaurantes, Ropa/accesorios/calzado, Comida rápida, Belleza, Papelería, Automotriz, Servicios (general, profesional, transporte, salud, limpieza, domicilio), entre otros.\n' +
  'Incluye "Tienda Mujer MiPyME Hidalgo" para mujeres registradas en Semana Mujer MiPyME.\n' +
  'Registro: 1) CURP, 2) WhatsApp, 3) Correo, 4) Contraseña, 5) Confirmar contraseña, 6) Aceptar Aviso de Privacidad → Registrarme.\n' +
  'Sitio: https://consume.hidalgo.gob.mx | Tel: +52 (771) 688 60 26 Ext. 217 | WhatsApp: 772 106 56 76\n' +
  'Correo: consumehidalgo@gmail.com | Dirección: Camino Real de la Plata 305, Zona Plateada, Pachuca | Horario: lun-vie 8:30-16:30\n\n' +

  '--- PROGRAMA: TRANSFORMANDO CON LA JUVENTUD ---\n' +
  'Apoya a jóvenes egresados (18-28 años) de Hidalgo con estancias productivas remuneradas de hasta 6 meses. Proceso gratuito. 84 municipios.\n' +
  'Apoyo: Educación Superior $10,000/mes | Bachillerato Tecnológico $9,000/mes.\n' +
  'Requisitos joven: 18-28 años, radicar en Hidalgo, egresado de bachillerato tecnológico o educación superior.\n' +
  'Documentos: certificado de estudios, CURP, comprobante domicilio (máx 3 meses), credencial votar con domicilio Hidalgo, CV, cobertura médica vigente (IMSS/ISSSTE/IMSS-Bienestar), carta compromiso, formato único.\n' +
  'Proceso: registro en plataforma → validación docs → unidades receptoras crean vacantes → candidatos solicitan entrevistas → comité aprueba → notificación → reporte mensual.\n' +
  'Sitio: https://transformandoconlajuventud.hidalgo.gob.mx | Tel: (771) 688 60 26 Ext. 177,149,150,163,215,216\n' +
  'Correo: transformandoconlajuventud@hidalgo.gob.mx\n\n' +

  '--- PROGRAMA: TU EXPERIENCIA TRANSFORMA ---\n' +
  'Apoya la inclusión económica de personas de 50 a 64 años desempleadas de Hidalgo, mediante estancias productivas. Proceso gratuito. 84 municipios.\n' +
  'Apoyo: $10,000 MXN/mes hasta 6 meses.\n' +
  'Requisitos: más de 50 y menos de 65 años, radicar en Hidalgo, estar desempleado, sin jubilación ni pensión.\n' +
  'Documentos: CV o resumen de experiencia, CURP, comprobante domicilio (máx 3 meses), credencial votar con domicilio Hidalgo, cobertura médica vigente, carta compromiso, formato único.\n' +
  'Proceso: registro en plataforma → validación docs → unidades receptoras crean vacantes → candidatos solicitan entrevistas → comité aprueba → notificación → reporte mensual.\n' +
  'Sitio: https://tuexperienciatransforma.hidalgo.gob.mx | Tel: (771) 688 60 26 Ext. 153,149,150,163,215,216\n' +
  'Correo: tuexperienciatransforma@hidalgo.gob.mx\n\n' +

  '--- PROGRAMA: IMPULSO NAFIN + HIDALGO ---\n' +
  'Créditos preferenciales para MiPyMEs de Hidalgo en alianza con NAFIN.\n' +
  'Montos: $100,000 a $5,000,000 MXN | Tasa: 14.75% anual fija | Plazos: hasta 60 meses | Sin comisión apertura | Sin penalización pagos anticipados.\n' +
  'Modalidades: Capital de Trabajo y Activo Fijo.\n' +
  'Requisitos: MiPyME registrada en Hidalgo, mínimo 2 años de antigüedad. Regímenes: PM, PFAE, RIF, RESICO.\n' +
  'Bancos: BBVA, Banorte, Santander, HSBC, BanBajío, Banamex.\n' +
  'Proceso: 1) Elegir banco, 2) Reunir documentos, 3) Precalificación bancaria, 4) Tramitar Cédula de Validación GRATUITA en SEDECO, 5) Firmar crédito.\n' +
  'Documentos cédula: INE/pasaporte, constancia situación fiscal, comprobante domicilio fiscal (máx 2 meses). Personas morales además: acta constitutiva y acta de poderes.\n' +
  'Sitio: https://impulso.hidalgo.gob.mx | Tel: 771 688 60 26 Ext. 231,162,106 | Correo: impulso@hidalgo.gob.mx\n' +
  'Dirección: Camino Real de la Plata 305, Zona Plateada, Pachuca | Horario: lun-vie 9:00-17:00\n\n' +

  '--- PROGRAMA: INCLUSIÓN FINANCIERA HIDALGO - FIRA ---\n' +
  'Alianza Gobierno de Hidalgo + FIRA. Garantía fiduciaria para micro, pequeñas y empresas familiares. Modalidades: Capital de Trabajo, Activo Fijo, Arrendamiento Financiero.\n' +
  'Montos: $10,000 a $1,300,000 MXN | Plazos: hasta 60 meses | Tasa: según institución financiera.\n' +
  'Requisitos: constituido en Hidalgo (PFAE o moral), mínimo 1 año operando, sectores industria/comercio/servicios (NO sector primario), máx 65 años, buen historial FIRA.\n' +
  'Instituciones: BanBajío, Santander, Kapital Bank, Ve por Más, Acreimex, CONSOL, CRESCA, Grupo Unicco, entre otras.\n' +
  'Proceso: 1) Preaprobación con institución financiera, 2) Enviar solicitud + fotos negocio a inclusionfinanciera@hidalgo.gob.mx, 3) SEDECO evalúa (10 días hábiles), 4) Carta de Validación GRATUITA → tramitar crédito con FIRA.\n' +
  'Agencias FIRA:\n' +
  '- Pachuca: Ing. Dulce Rosario Vázquez, dvazquezr@fira.gob.mx, 771 718 3683 / 771 713 6750. Av. Constituyentes 100, Pabellón Parotti 2do piso, Fracc. Constitución.\n' +
  '- Tulancingo: Ing. Ariadna Lavariega, alavariega@fira.gob.mx, 775 753 3172 / 775 753 6759. Molino del Rey 102 2do piso, Col. Centro, CP 43600.\n' +
  '- Ixmiquilpan: Ing. Blanca Azucena Ortíz, baortiz@fira.gob.mx, 759 723 0530 / 759 723 1375. Blvd. Insurgentes Oriente 86-C, Col. Centro, CP 42300.\n' +
  'Sitio: https://inclusionfinanciera.hidalgo.gob.mx | Correo: inclusionfinanciera@hidalgo.gob.mx\n' +
  'Tel SEDECO: 771 688 60 26 Ext. 231,162,106 | WhatsApp: 772 106 56 76 | Dirección: Camino Real de la Plata 305, Pachuca.\n\n' +

  '--- PROGRAMA: MI SITIO WEB HIDALGO ---\n' +
  'Plataforma gratuita de SEDECO para que empresas, industrias y productores hidalguenses creen su propia página web personalizada y tengan presencia en línea. Más de 200 empresas registradas.\n' +
  'Beneficios: hosting gratuito, más de 10 plantillas, personalización sencilla, ahorro de tiempo y costo, presencia en línea, promoción del negocio. Se puede descargar el sitio para publicarlo en un dominio propio.\n' +
  'Requisitos: pertenecer al Estado de Hidalgo. Apto para cualquier empresa comercial, industrial o productor. No se permiten negocios con contenido difamatorio, obsceno, fraudulento, racista o que aliente conductas ilegales.\n' +
  'Funcionalidades: publicidad del negocio (imágenes e información general). Los sitios se publican en la sección "Empresas" de PyMES Hidalgo y son visibles para cualquier usuario.\n' +
  'Registro (pasos): 1) Crear cuenta con correo y contraseña, 2) Completar perfil con información del negocio, 3) Subir fotos, 4) Enviar para validación, 5) Publicación inmediata.\n' +
  'No se requiere ningún trámite adicional. La baja se solicita por correo electrónico.\n' +
  'Sitio: https://misitioweb.hidalgo.gob.mx\n' +
  'Correo: pymeshidalgo.info@gmail.com | WhatsApp: (772) 106 56 76\n' +
  'Teléfonos: (771) 688 60 24 / 717 7652 Ext. 149/153/162/215/216\n' +
  'Dirección: Camino Real de la Plata #305, Zona Plateada, Pachuca | Horario: lun-vie 8:30-16:30';

// Historial de conversación por usuario: numero -> [ mensajes ]
const conversaciones = new Map();

function iniciarConversacion(numero) {
  conversaciones.set(numero, [
    { role: 'system', content: SYSTEM_PROMPT }
  ]);
}

async function ollamaChat(numero, userMessage) {
  if (!conversaciones.has(numero)) iniciarConversacion(numero);
  const history = conversaciones.get(numero);

  history.push({ role: 'user', content: userMessage });

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, messages: history, stream: false })
  });

  if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);

  const data = await response.json();
  const reply = data.message.content;

  history.push({ role: 'assistant', content: reply });

  // Mantener solo los últimos 20 mensajes (sin contar el system)
  if (history.length > 21) history.splice(1, history.length - 21);

  return reply;
}

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

  const texto = msg.body.trim();

  // Comando /reiniciar — borra el historial y saluda de nuevo
  if (texto.toLowerCase() === '/reiniciar') {
    iniciarConversacion(numero);
    const saludo = nombre ? `¡Hola de nuevo, ${nombre}! ` : '¡Hola de nuevo! ';
    await msg.reply(`${saludo}He reiniciado nuestra conversación. ¿En qué puedo ayudarte hoy?`);
    return;
  }

  // Registrar contacto (solo la primera vez)
  try {
    const { nuevo } = await registrarContacto(numero, nombre);
    if (nuevo) console.log(`[NUEVO CONTACTO] +${numero} (${nombre || 'sin nombre'})`);
  } catch (err) {
    console.error('[DB] Error registrando contacto:', err.message);
  }

  // Todos los mensajes van directo a Ollama
  console.log(`[OLLAMA] +${numero}: ${texto}`);
  try {
    const respuesta = await ollamaChat(numero, texto);
    await msg.reply(respuesta);
  } catch (err) {
    console.error('[OLLAMA] Error:', err.message);
    await msg.reply(
      `⚠️ En este momento no puedo procesar tu mensaje. Por favor intenta de nuevo en unos segundos.\n\n` +
      `Si el problema persiste, contáctanos directamente:\n` +
      `📞 (771) 688 60 26\n📧 sedeco@hidalgo.gob.mx`
    );
  }
});

module.exports = { client, state };
