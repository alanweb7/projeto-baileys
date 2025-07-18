const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const P = require('pino');

const logger = require('./utils/logger');

async function startBaileys() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // vamos imprimir manualmente
    logger: P({ level: 'silent' }) // menos poluição no terminal
  });


  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type === 'notify') {
      messages.forEach((msg) => {
        const from = msg.key.remoteJid;
        const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

        logger.info(`📩 Mensagem de ${from}: ${body}`);
      });
    }
  });

  // Exibe QR Code quando necessário
  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update;
    if (qr) {
      console.log('📱 Escaneie o QR Code com o WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp com sucesso!!');
    }

    if (connection === 'close') {
      const shouldReconnect = update.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('🔌 Conexão encerrada.', shouldReconnect ? 'Reconectando...' : 'Usuário deslogado.');
      if (shouldReconnect) {
        startBaileys();
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

startBaileys();
