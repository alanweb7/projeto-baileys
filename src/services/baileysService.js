// src/services/baileysService.js
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const logger = require('../utils/logger');
const path = require('path');

let currentQR = null;
let isConnecting = false; // Flag para evitar múltiplas conexões

const connectBaileys = async () => {
  if (isConnecting) return;
  isConnecting = true;

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
      const reason = update.lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = reason === DisconnectReason.loggedOut;
      const isRestartRequired = reason === DisconnectReason.restartRequired;
      const shouldReconnect = !isLoggedOut && !isRestartRequired;

      console.log(`🔌 Conexão encerrada. Código: ${reason}.`, shouldReconnect ? 'Reconectando...' : 'Não será reconectado.');

      if (reason === 515) {
        const fs = require('fs');
        const authPath = path.resolve(__dirname, '../../auth_info_baileys');
        fs.rmSync(authPath, { recursive: true, force: true });
        console.warn('🧹 Sessão corrompida detectada. Sessão removida. Escaneie um novo QR.');
        isConnecting = false;
        return;
      }

      if (shouldReconnect) {
        setTimeout(() => connectBaileys(), 3000); // espera antes de reconectar
      } else {
        isConnecting = false; // libera flag se não for reconectar
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
