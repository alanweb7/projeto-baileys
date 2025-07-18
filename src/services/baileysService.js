// src/services/baileysService.js
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const logger = require('../utils/logger');
const path = require('path');

let currentQR = null; // <-- Aqui no topo (escopo do módulo)

const connectBaileys = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
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
    const { connection, qr } = update;
    if (qr) {
      currentQR = qr; // <-- Salva o QR
      console.log('📱 Escaneie o QR Code com o WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp com sucesso!!');
      currentQR = null; // Limpa o QR após conexão
    }

    if (connection === 'close') {
      const shouldReconnect = update.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('🔌 Conexão encerrada.', shouldReconnect ? 'Reconectando...' : 'Usuário deslogado.');
      if (shouldReconnect) {
        connectBaileys();
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);
};

// Exporta a função de conexão e o QR atual
module.exports = {
  connectBaileys,
  getCurrentQR: () => currentQR,
};
