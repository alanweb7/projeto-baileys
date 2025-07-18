/**
 * Configura seu servidor Node.js com 
 * Express e definição de rotas
 */

// Carrega variáveis de ambiente do arquivo .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { validateMessage } = require('./middleware/validation');
const { sendMessage, receiveMessages } = require('./controllers/messageController');
const { queueStatus } = require('./controllers/queueController');
const { connectBaileys, getCurrentQR } = require('./services/baileysService');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.post('/api/messages/send', validateMessage, sendMessage);
app.get('/api/messages/receive/:queueName', receiveMessages);
app.get('/api/queues/status', queueStatus);

// seriço de conexão ao beikleys
// app.get('/api/conn/qrcode', async (req, res) => {
//   await connectBaileys();

//   const qr = getCurrentQR();
//   if (qr) {
//     res.json({ success: true, qr });
//   } else {
//     res.json({ success: false, message: 'QR Code não disponível.' });
//   }
// });


app.get('/api/conn/qrcode', async (req, res) => {
  const conn = await Update();
  const qr =  "Inicializou...";
  // const qr =  await getCurrentQR();
  // if (!qr) return res.status(204).send(); // No QR available
  // res.json({ qr });
  res.json({ qr });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});