const { makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const P = require('pino');

const logger = require('./utils/logger');

let globalSock = null; // ← guarda o socket atual

async function startBaileys() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: 'silent' }),
  });

  globalSock = sock; // ← atualiza o socket global

  // Evento de nova mensagem
sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type === 'notify') {
    for (const msg of messages) {
      const from = msg.key.remoteJid;
      const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

      logger.info(`📩 Mensagem de ${from}: ${body}`);
      delay(500);

      // Só envia se estiver conectado
      if (sock?.user && sock?.ws?.readyState === 1) {
        try {
          await SendMessage(sock, from, { text: 'Boa tarde' });
        } catch (error) {
          console.error('❌ Erro ao enviar mensagem:', error);
        }
      } else {
        console.log("⚠️ Não foi possível responder. Socket desconectado.");
      }
    }
  }
});


  // Evento de QR e conexão
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

// Função segura para envio de mensagens
const SendMessage = async (sock, jid, msg) => {
  try {
    if (sock?.user && sock?.ws?.readyState === 1) {
      await sock.presenceSubscribe(jid);
      await delay(1500);
      await sock.sendPresenceUpdate('composing', jid);
      await delay(1000);
      await sock.sendPresenceUpdate('paused', jid);
      return await sock.sendMessage(jid, msg);
    } else {
      console.log("⚠️ Tentativa de envio com socket fechado.");
    }
  } catch (err) {
    console.error("❌ Erro ao enviar mensagem:", err.message);
  }
};

startBaileys();
