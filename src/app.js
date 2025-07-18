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

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.post('/api/messages/send', validateMessage, sendMessage);
app.get('/api/messages/receive/:queueName', receiveMessages);
app.get('/api/queues/status', queueStatus);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
offi