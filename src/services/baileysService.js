
const makeWaSocket = require('@whiskeysockets/baileys').default
const { delay, DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState  } = require('@whiskeysockets/baileys')
const P = require('pino')
const { unlink, existsSync, mkdirSync } = require('fs')
const express = require('express');
const http = require('http');
const port = process.env.PORT || 9002;
const app = express();
const server = http.createServer(app);
const Path = 'Sessions';

const fs = require('fs')
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));


const Update = (sock) => {
   sock.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr){
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
      if (connection === 'open'){
         console.log('CHATBOT - CONECTADO')
      }
   })
}

const Connection = async () => {
   const { version } = await fetchLatestBaileysVersion()
   if (!existsSync(Path)) {
      mkdirSync(Path, { recursive: true });
   }
   const { state, saveCreds } = await useMultiFileAuthState(Path)
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
   const sock = makeWaSocket(config, { auth: state });
   Update(sock.ev);
   sock.ev.on('creds.update', saveCreds);

   const SendMessage = async (jid, msg) => {
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
      if(data >= 5 && data < 12) {
         return 'bom dia!'
      } else if(data >= 12 && data < 18) {
         return 'boa tarde!'
      } else if(data >=18 && data < 23) {
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

         if (messageType === "extendedTextMessage") {
                textResponse = await executeQueries("ID-PROJETO", jid, [JSON.stringify(msg.message.extendedTextMessage.text)], 'pt-BR');

            } else if (messageType === "conversation") {
                textResponse = await executeQueries("ID-PROJETO", jid, [JSON.stringify(msg.message.conversation)], 'pt-BR');
            
            }
          
            await SendMessage(jid, { text: textResponse });
          
            //--------------------
            
            // MENSAGEM DE BOAS VINDAS (TEXO COM IMAGEM)
            if (textResponse === 'Iniciando seu atendimento...') {
                await SendMessage(jid, { image: {
                    url: './image/robert.jpg'},
                    caption: `Olá ${nomeUsuario}, ${saudacao} \nSeja muito bem-vindo ao assistente virtual do *Canal eConhecimento*.\n\n`+
                    "Digite o *número* referente a opção desejada:\n\n"+
                    "*1* - Suporte\n"+
                    "*2* - Financeiro\n"+
                    "*3* - Cursos Online\n"+
                    "*4* - Perguntas frequentes\n"+
                    "*5* - Redes sociais\n"+
                    "*6* - Parceria",
                    mimeType: 'image.jpg'
                    
                })
                
                .then(result => console.log('RESULT: ', result))
                .catch(err => console.log('ERROR: ', err))
                
            }
            
            
            //--------------------
            
            // MENSAGEM DE TEXO COMUM
            if (textResponse === 'Enviando texto comum...') {
                 await SendMessage(jid, {
                     text: `Olá *${nomeUsuario}* ${saudacao} \n Essa é uma mensagem de texto comum\n\n ` +
                    "1 - CONTINUAR \n" +
                    "2 - SAIR"
                 })
                
                .then(result => console.log('RESULT: ', result))
                .catch(err => console.log('ERROR: ', err))
                
            }        
            
            //--------------------
            
            // MENSAGEM COM ÁUDIO
            if (textResponse === 'Envio de áudio...') {
                await SendMessage(jid, { audio: {
                    url: './image/teste.ogg'},
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
                await SendMessage(jid, { video: {
                    url: './image/video.mp4'},
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
                await SendMessage(jid, { document: {
                    url: './image/Divulg-pro.pdf'},
                    fileName: '/Divulg-pro.pdf' ,
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
            
           // MENSAGEM DE CONTATO
           if (textResponse === 'Aqui está o contato do Marcos Monteiro 👇🏼😉') {
               const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
               + 'VERSION:3.0\n' 
               + 'FN:Marcos Monteiro\n' // full name
               + 'ORG:Marcos Monteiro;\n' // the organization of the contact
               + 'TEL;type=CELL;type=VOICE;waid=5585985282207:+55 85 98528 2207\n' // WhatsApp ID + phone number
               + 'END:VCARD';
               
               await SendMessage(jid, {
                   contacts: { 
                       displayName: 'Marcos Monteiro',
                       contacts: [{ vcard }]
                       
                   }
                   
               });
               
               await SendMessage(jid, {
                   text: '*0* - Voltar ao menu'
                   
               })
               
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err));
               
           }
            
           
      }
       
   });
    
};

Connection()

server.listen(port, function() {
    console.log('CHATBOT - Servidor rodando na porta: ' + port);
    
});