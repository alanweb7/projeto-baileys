// src/services/baileysService.js
const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');


let currentQR = null;
let isConnecting = false;
let socket = null;


const Update = (sock) => {
  sock.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('CHATBOT - Qrcode: ', qr);
    };
    if (connection === 'close') {
      const Reconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
      if (Reconnect) Connection()
      console.log(`CHATBOT - CONEXÃO FECHADA! RAZÃO: ` + DisconnectReason.loggedOut.toString());
      if (Reconnect === false) {
        fs.rmSync(Path, { recursive: true, force: true });
        const removeAuth = Path
        unlink(removeAuth, err => {
          if (err) throw err
        })
      }
    }
    if (connection === 'open') {
      console.log('CHATBOT - CONECTADO')
    }
  })
}


const connectBaileys = async () => {
  if (isConnecting) return;
  isConnecting = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messages.upsert', ({ messages, type }) => {
      if (type === 'notify') {
        messages.forEach((msg) => {
          const from = msg.key.remoteJid;
          const body =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text;

          if (body) {
            logger.info(`📩 Mensagem de ${from}: ${body}`);
          }
        });
      }
    });

    socket.ev.on('connection.update', async (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        currentQR = qr;
        console.log('📱 Escaneie o QR Code com o WhatsApp:');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'open') {
        console.log('✅ Conectado ao WhatsApp com sucesso!');
        currentQR = null;
        isConnecting = false;
      }

      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = code === DisconnectReason.loggedOut;
        const isRestartRequired = code === DisconnectReason.restartRequired;
        const isCorruptedSession = code === 515;

        console.warn(`🔌 Conexão encerrada. Código: ${code}`);

        if (isCorruptedSession) {
          const authPath = path.resolve(__dirname, '../../auth_info_baileys');
          fs.rmSync(authPath, { recursive: true, force: true });
          console.warn('🧹 Sessão corrompida. Pasta auth removida. Escaneie um novo QR.');
          isConnecting = false;
          return;
        }

        if (!isLoggedOut && !isRestartRequired) {
          console.log('🔁 Tentando reconectar...');
          setTimeout(() => connectBaileys(), 3000);
        } else {
          console.log('⚠️ Reconexão não será feita.');
          isConnecting = false;
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao conectar com o WhatsApp:', error);
    isConnecting = false;
  }
};

module.exports = {
  Update,
  connectBaileys,
  getCurrentQR: () => currentQR,
  getSocket: () => socket,
};
