/**
 * Esse módulo é responsável por garantir que uma mensagem formatada 
 * corretamente seja enviada de forma segura e persistente para uma fila 
 * RabbitMQ específica. Ele utiliza a conexão reaproveitada do módulo connectRabbitMQ.
 */


const { connectRabbitMQ } = require('../config/rabbitmq');

async function sendToQueue(queue, message) {
  try {
    const channel = await connectRabbitMQ();

    await channel.assertQueue(queue, { durable: true });
    const msgBuffer = Buffer.from(JSON.stringify(message));

    channel.sendToQueue(queue, msgBuffer, { persistent: true });

    return true;
  } catch (error) {
    console.error('Erro ao enviar mensagem para a fila:', error);
    throw error;
  }
}

async function getQueuesStatus(queueNames = []) {
  // Estabelece conexão com o canal do RabbitMQ
  const channel = await connectRabbitMQ();

  // Array para armazenar o status de cada fila
  const queueStatuses = [];

  // Percorre cada nome de fila informado
  for (const name of queueNames) {
    try {
      // Usa checkQueue para obter informações da fila (como mensagens e consumidores)
      const { messageCount, consumerCount } = await channel.checkQueue(name);

      // Adiciona o status da fila ao array
      queueStatuses.push({
        name,
        messageCount,
        consumerCount,
        isActive: consumerCount > 0 || messageCount > 0 // Fila ativa se tiver mensagens ou consumidores
      });
    } catch (error) {
      // Em caso de erro (por exemplo, fila inexistente), adiciona um status padrão
      queueStatuses.push({
        name,
        messageCount: 0,
        consumerCount: 0,
        isActive: false,
        error: 'Fila não encontrada ou erro ao verificar'
      });
    }
  }

  // Retorna o resultado final contendo os status das filas, status do RabbitMQ e timestamp
  return {
    success: true,
    queues: queueStatuses,
    rabbitMQStatus: 'connected',
    timestamp: new Date().toISOString()
  };
}


/**
 * Função responsável por consumir mensagens de uma fila do RabbitMQ.
 * @param {string} queue - Nome da fila que será lida.
 * @param {number} limit - Número máximo de mensagens a serem lidas.
 * @param {number} timeoutInSeconds - Tempo limite (em segundos) para aguardar novas mensagens.
 */
async function receiveMessagesFromQueue(queue, limit, timeoutInSeconds) {
  // Conecta ao RabbitMQ e obtém o canal de comunicação
  const channel = await connectRabbitMQ();

  // Garante que a fila existe (ou cria se não existir) com durabilidade habilitada
  await channel.assertQueue(queue, { durable: true });

  // Lista onde as mensagens lidas serão armazenadas
  const messages = [];
  // Marca o início do tempo para controle de timeout
  const startTime = Date.now();

  // Enquanto não atingir o limite de mensagens e o tempo não exceder
  while (messages.length < limit && (Date.now() - startTime) < timeoutInSeconds * 1000) {
    // Tenta obter uma mensagem da fila (modo manual, sem auto-confirmação)
    const msg = await channel.get(queue, { noAck: false });

    if (msg) {
      // Converte o conteúdo da mensagem para objeto JSON
      const content = JSON.parse(msg.content.toString());

      // Adiciona a mensagem no array com a data/hora de recebimento
      messages.push({
        ...content,
        receivedAt: new Date().toISOString()
      });

      // Envia ack (confirmação) para o RabbitMQ de que a mensagem foi processada
      channel.ack(msg);
    } else {
      // Se não houver mensagem, espera 200ms antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Retorna todas as mensagens que foram recebidas dentro do limite e tempo
  return messages;
}



// Exporta a função para ser usada em outros arquivos
module.exports = {
  getQueuesStatus,
  sendToQueue,
  receiveMessagesFromQueue
};