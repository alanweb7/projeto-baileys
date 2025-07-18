// src/services/baileysService.js
const { default: makeWaSocket, delay, DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');

const PORTA = process.env.PORT || 3000;
const SESSIONS_PATH = path.resolve(__dirname, '../Sessions');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Flag para evitar múltiplas conexões simultâneas
let estaConectando = false;
let socketBaileys = null;

// Função para controlar atualizações da conexão
function atualizarConexao(sock) {
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('QR Code gerado, escaneie no WhatsApp:');
      // Aqui poderia usar qrcode-terminal ou enviar para algum endpoint
      console.log(qr);
    }
    if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp!');
      estaConectando = false;
    }
    if (connection === 'close') {
      const motivo = lastDisconnect?.error?.output?.statusCode;
      const desconectado = motivo === DisconnectReason.loggedOut;
      const precisaReiniciar = motivo === DisconnectReason.restartRequired;
      const deveReconectar = !desconectado && !precisaReiniciar;

      console.log(`🔌 Conexão fechada (código ${motivo}). ${deveReconectar ? 'Reconectando...' : 'Não será reconectado.'}`);

      if (motivo === 515) {
        // Sessão corrompida
        if (fs.existsSync(SESSIONS_PATH)) {
          fs.rmSync(SESSIONS_PATH, { recursive: true, force: true });
          console.warn('🧹 Sessão corrompida removida. Escaneie novo QR.');
        }
        estaConectando = false;
        return;
      }

      if (deveReconectar) {
        setTimeout(() => iniciarConexao(), 3000);
      } else {
        estaConectando = false;
      }
    }
  });

  // Salva credenciais atualizadas
  sock.ev.on('creds.update', sock.auth.saveCreds);
}

// Função principal para iniciar a conexão
async function iniciarConexao() {
  if (estaConectando) return; // evita múltiplas conexões
  estaConectando = true;

  try {
    const { version } = await fetchLatestBaileysVersion();

    if (!fs.existsSync(SESSIONS_PATH)) {
      fs.mkdirSync(SESSIONS_PATH, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(SESSIONS_PATH);

    const config = {
      auth: state,
      logger: P({ level: 'error' }),
      printQRInTerminal: false, // Vamos controlar manualmente o QR
      version,
      connectTimeoutMs: 60000,
      getMessage: async () => ({ conversation: 'Chatbot' }),
    };

    socketBaileys = makeWaSocket(config);
    socketBaileys.auth = { saveCreds }; // para salvar credenciais depois

    atualizarConexao(socketBaileys);

    // Exemplo simples: logar mensagens recebidas
    socketBaileys.ev.on('messages.upsert', ({ messages, type }) => {
      if (type === 'notify') {
        messages.forEach(msg => {
          const from = msg.key.remoteJid;
          const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
          console.log(`📩 Mensagem de ${from}: ${body}`);
        });
      }
    });

  } catch (error) {
    console.error('Erro na conexão Baileys:', error);
    estaConectando = false;
  }
}

// Endpoint para ver status da conexão (exemplo básico)
app.get('/status', (req, res) => {
  res.json({ conectado: socketBaileys !== null && !estaConectando });
});

module.exports = { iniciarConexao };

// Inicializa servidor e conexão Baileys
server.listen(PORTA, () => {
  console.log(`Servidor rodando na porta: ${PORTA}`);
});