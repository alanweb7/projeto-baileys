//src/services/baileysService.js
const { delay, DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const makeWaSocket = require('@whiskeysockets/baileys').default
const qrcode = require('qrcode-terminal');
const logger = require('../utils/logger');




// const fs = require('fs');
const path = require('path');
const P = require('pino');
const fs = require('fs');
// const { existsSync, mkdirSync } = require('fs');

const conectando = new Map();


const Update = (sock, channelId) => {
  sock.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    console.log("Instância: ", channelId);
    if (qr) {
      console.log('Qrcode: ');
      qrcode.generate(qr, { small: true });
    };
    if (connection === 'close') {
      const Reconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
      if (Reconnect) Connection(channelId);

      logger.info(`CONEXÃO FECHADA! Code: ` + DisconnectReason.loggedOut.toString());

      if (Reconnect === false) {
        logger.info(`Reconnect...: `);
        const sessionPath = path.resolve(__dirname, `../../Sessions/${channelId}`);
        if (fs.existsSync(sessionPath)) {
          fs.rmSync(sessionPath, { recursive: true, force: true });
        }
      }
    }
    if (connection === 'open') {
      logger.info('CHATBOT - CONECTADO');
    }
  })
}

const conexoes = new Map(); // Guardar instâncias por ID/canal

const Connection = async (channelId = 'default') => {
  const sessionPath = path.resolve(__dirname, `../../Sessions/${channelId}`);
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

  const { version } = await fetchLatestBaileysVersion()
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

  const config = {
    auth: state,
    logger: P({ level: 'error' }),
    version,
    connectTimeoutMs: 60_000,
    async getMessage(key) {
      return { conversation: 'Chatbot' };
    },
  }

  const sock = makeWaSocket(config, { auth: state });

  // eventos da conexão
  Update(sock.ev, channelId);

  sock.ev.on('creds.update', saveCreds);
  conexoes.set(channelId, sock); // salva instância

  const SendMessage = async (jid, msg) => {
    console.log("Enviar mensagem: ", msg);
    await sock.presenceSubscribe(jid)
    await delay(1500)
    await sock.sendPresenceUpdate('composing', jid)
    await delay(1000)
    await sock.sendPresenceUpdate('paused', jid)
    return await sock.sendMessage(jid, msg)
  }


  ////SAUDAÇÃO
  let date = new Date();
  let data = date.toLocaleString('pt-BR', { timeZone: "America/Sao_Paulo", hour: 'numeric', hour12: false });
  function welcome(date) {
    if (data >= 5 && data < 12) {
      return 'bom dia!'
    } else if (data >= 12 && data < 18) {
      return 'boa tarde!'
    } else if (data >= 18 && data < 23) {
      return 'boa noite!'
    }
  }

  /////////////////////INICIO DAS FUNÇÕES/////////////////////

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    const msg = messages[0]
    const jid = msg.key.remoteJid
    const nomeUsuario = msg.pushName
    const saudacao = welcome(date)
    if ((jid) && !msg.key.fromMe && jid !== 'status@broadcast') {
      const messageTypes = Object.keys(msg.message);
      const messageType = messageTypes.find((t) => ['conversation', 'stickerMessage', 'videoMessage', 'imageMessage', 'documentMessage', 'locationMessage', 'extendedTextMessage', 'audioMessage'].includes(t));

      let textResponse = "";

      const textMsg = msg.message?.extendedTextMessage?.text || msg.message?.conversation;

      if (textMsg) {
        textResponse = await executeQueries("ID-PROJETO", jid, [textMsg], 'pt-BR');
        triggerMsg = textResponse.query;
      }

      console.log("Texto da query: ", triggerMsg);
      // await SendMessage(jid, { text: "Oie" });

      //--------------------

      // MENSAGEM DE BOAS VINDAS (TEXO COM IMAGEM)
      if (triggerMsg === '"Mande o PDF"') {
        await SendMessage(jid, {
          image: {
            url: path.resolve(__dirname, '../assets/images/ebook-default.jpg')
          },
          caption: `Olá ${nomeUsuario}, ${saudacao} \nSeja muito bem-vindo ao assistente virtual do *Canal eConhecimento*.\n\n` +
            "Digite o *número* referente a opção desejada:\n\n" +
            "*1* - Suporte\n" +
            "*2* - Financeiro\n" +
            "*3* - Cursos Online\n" +
            "*4* - Perguntas frequentes\n" +
            "*5* - Redes sociais\n" +
            "*6* - Parceria",
          mimeType: 'image.jpg'

        })

          .then(result => console.log('RESULT: ', result))
          .catch(err => console.log('ERROR: ', err))

      }

      //--------------------

      // MENSAGEM DE TEXO COMUM
      if (triggerMsg === '"Enviando texto comum..."' || triggerMsg === 'Enviando texto comum...') {
        // await SendMessage(jid, {
        //   text: "Ola"
        // })

        await sock.sendMessage(jid, { text: 'hello word' }, { quoted: "message" })

          // .then(result => console.log('RESULT: ', result))
          // .catch(err => console.log('ERROR: ', err))

      }

      //--------------------

      // MENSAGEM COM ÁUDIO
      if (textResponse === 'Envio de áudio...') {
        await SendMessage(jid, {
          audio: {
            url: './image/teste.ogg'
          },
          caption: 'Descrição do áudio',
          mimetype: 'audio/ogg'

        });
        await SendMessage(jid, {
          text: `Olá *${nomeUsuario}* \n Essa é uma mensagem de áudio\n\n ` +
            "1 - CONTINUAR \n" +
            "2 - SAIR"

        })

          .then(result => console.log('RESULT: ', result))
          .catch(err => console.log('ERROR: ', err))

      }

      //--------------------

      // MENSAGEM COM VÍDEO
      if (textResponse === 'Envio de vídeo...') {
        await SendMessage(jid, {
          video: {
            url: './image/video.mp4'
          },
          caption: 'Esse é um exemplo de vídeo',
          gifPlayback: true

        });
        await SendMessage(jid, {
          text: `Olá *${nomeUsuario}* \n Essa é uma mensagem de vídeo\n\n ` +
            "1 - CONTINUAR \n" +
            "2 - SAIR"

        })

          .then(result => console.log('RESULT: ', result))
          .catch(err => console.log('ERROR: ', err))

      }

      //--------------------

      // MENSAGEM COM DOCUMENTO PDF
      if (textResponse === 'Aqui está um PDF 👇🏼😉') {
        await SendMessage(jid, {
          document: {
            url: './image/Divulg-pro.pdf'
          },
          fileName: '/Divulg-pro.pdf',
          caption:
            "Tabela de valores",
          mimetype: 'application/PDF'

        })

        await SendMessage(jid, {
          text: //`Olá *${nomeUsuario}* \nEssa é uma mensagem de vídeo\n\n`+
            //"1 - CONTINUAR\n" +
            "*0* - Voltar ao menu"

        })

          .then(result => console.log('RESULT: ', result))
          .catch(err => console.log('ERROR: ', err))

      }

      //--------------------

      // MENSAGEM DE LOCALIZAÇÃO
      if (textResponse === 'Enviando Localização, Aguarde!...') {
        await SendMessage(jid, { location: { degreesLatitude: -2.917264183502438, degreesLongitude: -41.75231474744193 } }
        )

          .then(result => console.log('RESULT: ', result))
          .catch(err => console.log('ERROR: ', err))

      }

      //--------------------

    }

  });

};


async function executeQueries(projectId, sessionId, queries, languageCode) {
  let context;
  let intentResponse;
  for (const query of queries) {
    try {
      console.log(`Pergunta: ${query}`);
      intentResponse = {
        projectId,
        sessionId,
        query,
        context,
        languageCode
      };
      console.log('Enviando Resposta');
      console.log(intentResponse);
      return intentResponse;
    } catch (error) {
      console.log(error);
    }
  }
}


function getConexao(channelId) {
  return conexoes.get(channelId);
}


function statusConexao() {
  return "T";
}

module.exports = {
  Connection,
  statusConexao,
  getConexao,
};
