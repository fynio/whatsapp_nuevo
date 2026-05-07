const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { registrarContacto } = require('../models/Contacto');
const { registrarSeleccion } = require('../models/Seleccion');

const OLLAMA_URL   = 'http://localhost:11434';
const OLLAMA_MODEL = 'llama3.2';

// Usuarios en modo chat con Ollama: numero -> historial de mensajes
const ollamaUsers = new Map();

async function ollamaChat(numero, userMessage) {
  if (!ollamaUsers.has(numero)) ollamaUsers.set(numero, []);
  const history = ollamaUsers.get(numero);

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

  // Conservar solo los últimos 20 mensajes para no saturar el contexto
  if (history.length > 20) history.splice(0, history.length - 20);

  return reply;
}

const OPCIONES = {
  '1': 'Consume Hidalgo',
  '2': 'Transformando con la Juventud',
  '3': 'Tu Experiencia Transforma',
  '4': 'Impulso Nafin',
  '5': 'Inclusión Financiera',
  '6': 'Conectar con Ollama'
};

const MENU =
  `¿Qué información necesitas?\n\n` +
  `1️⃣ Consume Hidalgo\n` +
  `2️⃣ Transformando con la Juventud\n` +
  `3️⃣ Tu Experiencia Transforma\n` +
  `4️⃣ Impulso Nafin\n` +
  `5️⃣ Inclusión Financiera\n` +
  `6️⃣🦙 Conectar con Ollama\n\n` +
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

  const texto = msg.body.trim();

  // Comando /menu — siempre saca del modo Ollama
  if (texto.toLowerCase() === '/menu') {
    if (ollamaUsers.has(numero)) {
      ollamaUsers.delete(numero);
      await msg.reply(`_Has salido del chat con Ollama._\n\n${MENU}`);
    } else {
      await msg.reply(MENU);
    }
    return;
  }

  // Modo Ollama activo para este usuario
  if (ollamaUsers.has(numero)) {
    console.log(`[OLLAMA] +${numero}: ${texto}`);
    try {
      const respuesta = await ollamaChat(numero, texto);
      await msg.reply(respuesta);
    } catch (err) {
      console.error('[OLLAMA] Error:', err.message);
      await msg.reply(`⚠️ No pude conectarme con Ollama. Asegúrate de que esté corriendo en ${OLLAMA_URL}.\n\nEscribe /menu para volver al menú principal.`);
    }
    return;
  }

  // Detectar selección de opción del menú
  if (OPCIONES[texto]) {
    if (texto === '6') {
      ollamaUsers.set(numero, [
        {
          role: 'system',
          content:
            'Eres un asistente virtual del gobierno del estado de Hidalgo, México. ' +
            'Ayudas a los ciudadanos con información sobre programas gubernamentales. ' +
            'Responde siempre en español, de forma amable, clara y concisa. ' +
            'Si no sabes algo con certeza, dilo honestamente y sugiere contactar directamente al programa.\n\n' +

            '--- PROGRAMA: CONSUME HIDALGO ---\n' +
            'Plataforma digital gratuita de la Secretaría de Desarrollo Económico de Hidalgo (SEDECO) que conecta a empresas, industrias y productores hidalguenses con compradores locales. ' +
            'No tiene costo de inscripción, sin mensualidades y sin comisiones por venta. Cuenta con más de 2,000 empresas registradas.\n' +
            'Categorías disponibles: Salud, Alimentos, Artesanos, Restaurantes, Ropa/accesorios/calzado, Comida rápida y antojitos, Belleza y cuidado personal, Papelería/mercería/regalos, Automotriz, Servicio general, Servicio profesional, Servicio de transporte, Servicio de salud, Servicio de limpieza, Servicio de entrega a domicilio, entre otros.\n' +
            'Incluye la sección "Tienda Mujer MiPyME Hidalgo", espacio exclusivo para mujeres registradas en Semana Mujer MiPyME para mostrar sus stands.\n' +
            'Registro para vender/promocionar (pasos): 1) Ingresar CURP, 2) Número de WhatsApp, 3) Correo electrónico, 4) Contraseña, 5) Confirmar contraseña, 6) Aceptar Aviso de Privacidad y dar clic en Registrarme.\n' +
            'Sitio web: https://consume.hidalgo.gob.mx\n' +
            'Teléfono: +52 (771) 688 60 26 Ext. 217\n' +
            'WhatsApp: 772 106 56 76\n' +
            'Correo: consumehidalgo@gmail.com\n' +
            'Dirección: Camino Real de la Plata No. 305, Zona Plateada, Pachuca de Soto, Hidalgo\n' +
            'Horario: lunes a viernes de 8:30 a 16:30 horas\n\n' +

            '--- PROGRAMA: TRANSFORMANDO CON LA JUVENTUD ---\n' +
            'Programa del Gobierno de Hidalgo (SEDECO) que apoya a jóvenes egresados mediante estancias productivas remuneradas en empresas u organizaciones (Unidades Receptoras), con el objetivo de incorporarlos al mercado laboral. ' +
            'Aplica en los 84 municipios del estado de Hidalgo. El proceso es 100% gratuito y personal.\n' +
            'Requisitos para jóvenes: tener entre 18 y 28 años (menores de 29), radicar en Hidalgo, ser egresado de bachillerato tecnológico o educación superior.\n' +
            'Apoyo económico mensual (hasta 6 meses): Egresados de Educación Superior: $10,000 MXN/mes. Egresados de Bachillerato Tecnológico: $9,000 MXN/mes.\n' +
            'Documentos del joven egresado: certificado de estudios, CURP, comprobante de domicilio en Hidalgo (máx. 3 meses), credencial para votar con domicilio en Hidalgo, currículum vitae, comprobante de cobertura médica vigente (IMSS/ISSSTE/IMSS-Bienestar), carta compromiso firmada, formato único de solicitante.\n' +
            'Unidades Receptoras aceptadas: personas físicas con actividad empresarial, personas morales, sociedades cooperativas, ejidos, cámaras empresariales, asociaciones civiles, fundaciones, uniones de productores e instituciones públicas de los tres órdenes de gobierno.\n' +
            'Proceso: 1) Registro en la plataforma digital, 2) Validación de documentos, 3) Unidades receptoras crean vacantes y revisan perfiles, 4) Candidatos solicitan entrevistas, 5) Comité técnico evalúa y aprueba, 6) Notificación por correo/llamada/plataforma con fecha de inicio, 7) Becario entrega reporte mensual de actividades validado por la unidad receptora.\n' +
            'Vigencia: activa según suficiencia presupuestal del ejercicio fiscal 2026.\n' +
            'Sitio web: https://transformandoconlajuventud.hidalgo.gob.mx\n' +
            'Teléfonos: (771) 688 60 26 Ext. 177, 149, 150, 163, 215 y 216\n' +
            'Correo: transformandoconlajuventud@hidalgo.gob.mx\n\n' +

            '--- PROGRAMA: TU EXPERIENCIA TRANSFORMA ---\n' +
            'Programa del Gobierno de Hidalgo (SEDECO) que apoya la inclusión económica de personas mayores de 50 y menores de 65 años en situación de desempleo, mediante estancias productivas remuneradas en empresas u organizaciones (Unidades Receptoras). ' +
            'Aplica en los 84 municipios del estado de Hidalgo. El proceso es 100% gratuito y personal.\n' +
            'Requisitos para candidatos: tener más de 50 y menos de 65 años, radicar en Hidalgo, estar desempleado, no contar con jubilación o pensión.\n' +
            'Apoyo económico: $10,000 MXN mensuales durante hasta 6 meses.\n' +
            'Documentos del candidato: currículum vitae o resumen de experiencia, CURP, comprobante de domicilio en Hidalgo (máx. 3 meses), credencial para votar con domicilio en Hidalgo, comprobante de cobertura médica vigente (IMSS/ISSSTE/IMSS-Bienestar), carta compromiso firmada, formato único de solicitante.\n' +
            'Unidades Receptoras aceptadas: personas físicas con actividad empresarial, personas morales, sociedades cooperativas, ejidos, cámaras empresariales, asociaciones civiles, fundaciones, uniones de productores e instituciones públicas de los tres órdenes de gobierno.\n' +
            'Proceso: 1) Registro en la plataforma, 2) Validación de documentos, 3) Unidades receptoras crean vacantes y revisan perfiles, 4) Candidatos solicitan entrevistas, 5) Comité técnico evalúa y aprueba, 6) Notificación con fecha de inicio, 7) Becario entrega reporte mensual validado por la unidad receptora. Candidatos no aprobados quedan libres para aplicar a nuevas vacantes.\n' +
            'Vigencia: activa según suficiencia presupuestal del ejercicio fiscal 2026.\n' +
            'Sitio web: https://tuexperienciatransforma.hidalgo.gob.mx\n' +
            'Teléfonos: (771) 688 60 26 Ext. 153, 149, 150, 163, 215 y 216\n' +
            'Correo: tuexperienciatransforma@hidalgo.gob.mx\n\n' +

            '--- PROGRAMA: IMPULSO NAFIN + HIDALGO ---\n' +
            'Programa del Gobierno de Hidalgo en alianza con Nacional Financiera (NAFIN) que otorga créditos preferenciales a MiPyMEs registradas en Hidalgo.\n' +
            'Condiciones del crédito: montos desde $100,000 hasta $5,000,000 MXN, tasa de interés fija del 14.75% anual sobre saldos insolutos, plazos de hasta 60 meses (5 años), sin comisión por apertura, sin penalización por pagos anticipados.\n' +
            'Modalidades: Capital de Trabajo y Activo Fijo.\n' +
            'Requisitos: ser MiPyME registrada en Hidalgo con mínimo 2 años de antigüedad.\n' +
            'Regímenes fiscales aceptados: Persona Moral (PM), Persona Física con Actividad Empresarial (PFAE), Régimen de Incorporación Fiscal (RIF), Régimen Simplificado de Confianza (RESICO).\n' +
            'Bancos participantes: BBVA, Banorte, Santander, HSBC, BanBajío y Banamex. Cada banco tiene sus propias políticas crediticias; verificar giros restringidos directamente con el banco.\n' +
            'Proceso: 1) Elegir banco participante, 2) Reunir documentos según régimen fiscal, 3) Obtener precalificación del banco, 4) Tramitar Cédula de Validación Estatal (GRATUITA) en SEDECO, 5) Regresar al banco con la cédula y firmar el crédito.\n' +
            'Documentos para la Cédula (todos los regímenes): identificación oficial vigente (INE o pasaporte), constancia de situación fiscal, comprobante de domicilio fiscal reciente (máx. 2 meses: luz, agua o teléfono fijo). Personas morales además: acta constitutiva y acta de poderes.\n' +
            'Datos adicionales que se piden para la Cédula: nombre/razón social, RFC, tamaño de empresa, sector y giro, número de trabajadores, ventas anuales, tipo y monto del crédito, destino del crédito, banco preferido, entre otros.\n' +
            'Sitio web: https://impulso.hidalgo.gob.mx\n' +
            'Teléfono: 771 688 60 26 Ext. 231, 162 y 106\n' +
            'Correo: impulso@hidalgo.gob.mx\n' +
            'Dirección: Camino Real de la Plata #305, Zona Plateada, Pachuca de Soto, Hidalgo\n' +
            'Horario: lunes a viernes de 9:00 a 17:00 horas\n\n' +

            '--- PROGRAMA: INCLUSIÓN FINANCIERA HIDALGO - FIRA ---\n' +
            'Alianza entre el Gobierno de Hidalgo y FIRA para impulsar la inclusión financiera, productividad y acceso a mercados de micro, pequeñas y empresas familiares. ' +
            'Otorga garantía fiduciaria a empresas hidalguenses para acceder a créditos en modalidades de Capital de Trabajo, Activo Fijo y Arrendamiento Financiero. ' +
            'Montos: desde $10,000 hasta $1,300,000 MXN. Plazos: hasta 60 meses. Tasa: depende de la institución financiera seleccionada. ' +
            'Requisitos: estar formalmente constituido en Hidalgo (persona física con actividad empresarial o moral), mínimo 1 año en operación, sectores industria/comercio/servicios (NO sector primario), edad máxima 65 años, buen historial crediticio con FIRA. ' +
            'Instituciones financieras participantes: BanBajío, Santander, Kapital Bank, Ve por Más, Acreimex, CONSOL, CRESCA, Grupo Unicco, entre otras. ' +
            'Proceso: 1) Obtener preaprobación de crédito con la institución financiera, 2) Enviar formato de solicitud + fotos del negocio a inclusionfinanciera@hidalgo.gob.mx, 3) SEDECO evalúa en 10 días hábiles, 4) Si se aprueba, se emite Carta de Validación para tramitar el crédito con FIRA. El trámite de la carta es GRATUITO. ' +
            'Agencias FIRA en Hidalgo:\n' +
            '- Pachuca: Ing. Dulce Rosario Vázquez Romero, dvazquezr@fira.gob.mx, Tel. 771 718 3683 / 771 713 6750. Dirección: Av. Constituyentes 100, Edif. Pabellón Parotti 2do piso, Fracc. Constitución, Pachuca.\n' +
            '- Tulancingo: Ing. Ariadna Lavariega Martínez, alavariega@fira.gob.mx, Tel. 775 753 3172 / 775 753 6759. Dirección: Molino del Rey 102 2do piso, Col. Centro, Tulancingo, CP 43600.\n' +
            '- Ixmiquilpan: Ing. Blanca Azucena Ortíz Ortega, baortiz@fira.gob.mx, Tel. 759 723 0530 / 759 723 1375. Dirección: Blvd. Insurgentes Oriente 86-C, Col. Centro, Ixmiquilpan, CP 42300.\n' +
            'Sitio web: https://inclusionfinanciera.hidalgo.gob.mx\n' +
            'Correo: inclusionfinanciera@hidalgo.gob.mx\n' +
            'Teléfono SEDECO: 771 688 60 26 Ext. 231, 162 y 106 / WhatsApp: 772 106 56 76\n' +
            'Dirección: Camino Real de la Plata #305, Zona Plateada, Pachuca de Soto, Hidalgo.'
        }
      ]);
      await msg.reply(
        `🦙 *Chat con Ollama activado* (modelo: ${OLLAMA_MODEL})\n\n` +
        `Ahora puedes escribirme lo que quieras y te responderé con IA.\n` +
        `_Escribe /menu cuando quieras volver al menú principal._`
      );
    } else {
      await msg.reply(`Has seleccionado: *${OPCIONES[texto]}*`);
    }
    try {
      await registrarSeleccion(numero, parseInt(texto), OPCIONES[texto]);
      console.log(`[SELECCION] +${numero} → opción ${texto}: ${OPCIONES[texto]}`);
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
