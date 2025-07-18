const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} = require('@whiskeysockets/baileys');

const qrcode = require('qrcode-terminal');
const logger = require('../utils/logger');


const fs = require('fs');
const path = require('path');
const P = require('pino');

const pastaSessao = path.resolve(__dirname, '../../Sessions');
let socketBaileys = null;
let estaConectando = false;


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


async function iniciarConexao() {
  if (estaConectando || socketBaileys) return;
  estaConectando = true;

  try {
    if (!fs.existsSync(pastaSessao)) {
      fs.mkdirSync(pastaSessao, { recursive: true });
    }

    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(pastaSessao);

    const config = {
      auth: state,
      logger: P({ level: 'error' }),
      printQRInTerminal: true,
      version,
      connectTimeoutMs: 60_000,
      async getMessage(key) {
        return { conversation: 'Chatbot' };
      },
    }

    const socketBaileys = makeWaSocket(config, { auth: state });
    Update(socketBaileys.ev);

    // socketBaileys.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    //   if (qr) {
    //     console.log('🧾 Escaneie o QRcode:');
    //     qrcode.generate(qr, { small: true });
    //   }

    //   if (connection === 'open') {
    //     console.log('✅ Conectado ao WhatsApp!');
    //     estaConectando = false;
    //   }

    //   if (connection === 'close') {
    //     const statusCode = lastDisconnect?.error?.output?.statusCode;

    //     console.log('🔌 Conexão encerrada:', statusCode);

    //     // Se for logout ou falha de sessão, limpa credenciais
    //     if (statusCode === DisconnectReason.loggedOut || statusCode === 515) {
    //       if (fs.existsSync(pastaSessao)) {
    //         fs.rmSync(pastaSessao, { recursive: true, force: true });
    //         console.log('🧹 Sessão removida. Será necessário escanear QR novamente.');
    //       }
    //       socketBaileys = null;
    //       estaConectando = false;
    //     } else {
    //       // Tenta reconectar
    //       socketBaileys = null;
    //       estaConectando = false;
    //       iniciarConexao();
    //     }
    //   }
    // });

    socketBaileys.ev.on('creds.update', saveCreds);

    socketBaileys.ev.on('messages.upsert', async ({ messages }) => {
      for (let msg of messages) {
        const from = msg.key.remoteJid;
        const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
        console.log(`📩 Mensagem recebida de ${from}: ${body}`);
        logger.info(`📩 Mensagem de ${from}: ${body}`);
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
