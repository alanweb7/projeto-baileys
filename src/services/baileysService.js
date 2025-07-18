// src/services/baileysService.js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const logger = require('../utils/logger');
const path = require('path');

const connectBaileys = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(path.resolve(__dirname, '../auth'));

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // QR será exibido no terminal
    logger: {
      info: (msg) => logger.info(msg),
      error: (msg) => logger.error(msg),
      warn: (msg) => logger.warn(msg),
      debug: () => {}, // opcional
    },
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

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      logger.warn('🔌 Conexão encerrada. ' +
        (shouldReconnect ? 'Tentando reconectar...' : 'Usuário deslogado.')
      );

      if (shouldReconnect) {
        connectBaileys(); // reconecta se não foi logout
      }
    } else if (connection === 'open') {
      logger.info('✅ Conectado ao WhatsApp com sucesso!');
    }
  });

  sock.ev.on('creds.update', saveCreds);
};

module.exports = { connectBaileys };
