const { isUniqueId, markIdAsUsed } = require('../services/idService');

const { sendToQueue, receiveMessagesFromQueue } = require('../services/rabbitMQService');

const { v4: uuidv4 } = require('uuid');

async function sendMessage(req, res) {
  try {
    const { queue, message } = req.body;

    let messageId = message.id;

    if (messageId === 'rand') {
      messageId = await generateUniqueMessageId(isUniqueId);
      message.id = messageId;
    } else {
      const unique = await isUniqueId(message.id);
      if (!unique) {
        return res.status(409).json({ success: false, error: 'ID da mensagem já foi usado' });
      }
    }

    await sendToQueue(queue, message);
    await markIdAsUsed(message.id);

    return res.status(200).json({
      success: true,
      messageId: message.id,
      queueName: queue,
      timestamp: message.timestamp
    });
  } catch (error) {
    console.error('Erro no sendMessage:', error);
    return res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
}

// Define a função assíncrona que será usada como controller para a rota de recebimento de mensagens
async function receiveMessages(req, res) {
  // Obtém o nome da fila a partir dos parâmetros da URL (ex: /api/queue/:queueName)
  const queue = req.params.queueName;

  // Converte o parâmetro de limite (limit) da query string em número. Default: 10 mensagens
  const limit = parseInt(req.query.limit, 10) || 10;

  // Converte o parâmetro de timeout da query string em número de segundos. Default: 5 segundos
  const timeout = parseInt(req.query.timeout, 10) || 5;

  try {
    // Chama o serviço que consome as mensagens da fila com os parâmetros fornecidos
    const messages = await receiveMessagesFromQueue(queue, limit, timeout);

    // Retorna uma resposta JSON com sucesso, mensagens recebidas, nome da fila e total de mensagens
    return res.status(200).json({
      success: true,
      messages,
      queueName: queue,
      totalReceived: messages.length
    });
  } catch (error) {
    // Em caso de erro, loga no console e retorna erro 500 com mensagem genérica
    console.error('Erro ao receber mensagens:', error);
    return res.status(500).json({ success: false, error: 'Erro ao consumir mensagens da fila' });
  }
}


async function generateUniqueMessageId(isUniqueFn) {
  let newId;
  let attempts = 0;

  do {
    newId = uuidv4(); // ou use outro método de geração
    attempts++;
    // Proteção contra loop infinito
    if (attempts > 10) {
      throw new Error('Falha ao gerar um ID único após 10 tentativas');
    }
  } while (!(await isUniqueFn(newId)));

  return newId;
}


module.exports = {
  sendMessage,
  receiveMessages
};
