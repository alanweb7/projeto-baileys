const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const P = require('pino');

const pastaSessao = path.resolve(__dirname, '../../Sessions');
let socketBaileys = null;
let estaConectando = false;

async function iniciarConexao() {
  if (estaConectando || socketBaileys) return;
  estaConectando = true;

  try {
    if (!fs.existsSync(pastaSessao)) {
      fs.mkdirSync(pastaSessao, { recursive: true });
    }

    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(pastaSessao);

    socketBaileys = makeWASocket({
      version,
      logger: P({ level: 'silent' }),
      printQRInTerminal: true,
      auth: state,
      getMessage: async () => ({ conversation: 'Mensagem padrão' }),
    });

    socketBaileys.ev.on('creds.update', saveCreds);

    socketBaileys.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        console.log('🧾 QR gerado:', qr);
      }

      if (connection === 'open') {
        console.log('✅ Conectado ao WhatsApp!');
        estaConectando = false;
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;

        console.log('🔌 Conexão encerrada:', statusCode);

        // Se for logout ou falha de sessão, limpa credenciais
        if (statusCode === DisconnectReason.loggedOut || statusCode === 515) {
          if (fs.existsSync(pastaSessao)) {
            fs.rmSync(pastaSessao, { recursive: true, force: true });
            console.log('🧹 Sessão removida. Será necessário escanear QR novamente.');
          }
          socketBaileys = null;
          estaConectando = false;
        } else {
          // Tenta reconectar
          socketBaileys = null;
          estaConectando = false;
          iniciarConexao();
        }
      }
    });

    socketBaileys.ev.on('messages.upsert', async ({ messages }) => {
      for (let msg of messages) {
        const from = msg.key.remoteJid;
        const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
        console.log(`📩 Mensagem recebida de ${from}: ${body}`);
      }
    });

  } catch (err) {
    console.error('❌ Erro ao conectar ao WhatsApp:', err);
    estaConectando = false;
  }
}

function statusConexao() {
  return {
    conectado: !!socketBaileys,
    emConexao: estaConectando,
  };
}

function getSocket() {
  return socketBaileys;
}

module.exports = {
  iniciarConexao,
  statusConexao,
  getSocket,
};
