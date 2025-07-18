/**
 * Esse módulo se conecta ao RabbitMQ uma única vez e retorna um 
 * canal reutilizável para evitar múltiplas conexões desnecessárias. 
 * O canal será usado para publicar ou consumir mensagens das filas do RabbitMQ.
 */

const amqp = require('amqplib'); // Importa a biblioteca amqplib para comunicação com RabbitMQ

let channel; // Variável para armazenar o canal da conexão (reutilizado para evitar múltiplas conexões)

async function connectRabbitMQ() {
  // Se o canal já foi criado, retorna ele para reutilização
  if (channel) return channel;

  // Desestrutura as variáveis de ambiente necessárias para a conexão
  const {
    RABBITMQ_HOST,
    RABBITMQ_PORT,
    RABBITMQ_USER,
    RABBITMQ_PASS,
    RABBITMQ_VHOST
  } = process.env;

  // Monta a string de conexão usando as variáveis de ambiente
  // Atenção: RABBITMQ_VHOST deve conter a barra inicial, ex: "/"
  const connectionString = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}${RABBITMQ_VHOST}`;

  try {
    // Conecta ao RabbitMQ usando a string de conexão
    const connection = await amqp.connect(connectionString);

    // Cria um canal na conexão, que será usado para enviar/receber mensagens
    channel = await connection.createChannel();

    // Loga o sucesso da conexão
    console.log('Conectado ao RabbitMQ');

    // Retorna o canal para uso nas operações subsequentes
    return channel;
  } catch (error) {
    // Caso ocorra erro, loga o erro e repassa para tratamento posterior
    console.error('Erro ao conectar ao RabbitMQ:', error);
    throw error;
  }
}

// Exporta a função para que outros módulos possam utilizar a conexão com RabbitMQ
module.exports = {
  connectRabbitMQ
};


