/**
 * Este módulo serve para garantir que cada mensagem enviada tenha um ID único. 
 * Ele usa o Redis como cache temporário para controlar quais IDs já foram usados, 
 * expirando automaticamente após 24 horas.
 * Isso evita reprocessamentos acidentais ou mensagens duplicadas na fila.
 */

// Importa a instância do Redis configurada no arquivo ../config/database
const database = require('../config/database');

// Define o tempo de expiração dos IDs armazenados (24 horas em segundos)
const ID_EXPIRATION_SECONDS = 60 * 60 * 24; // 24 horas

// Função para verificar se um ID é único (ainda não foi usado)
async function isUniqueId(id) {
  // Verifica se a chave msgid:{id} já existe no Redis
  const exists = await database.exists(`msgid:${id}`);
  // Retorna true se o ID ainda não existe (é único), false caso contrário
  return !exists;
}

// Função para marcar um ID como usado no Redis
async function markIdAsUsed(id) {
  // Armazena a chave msgid:{id} com valor '1' e define a expiração para 24 horas
  await database.setEx(`msgid:${id}`, ID_EXPIRATION_SECONDS, '1');
}

module.exports = { isUniqueId, markIdAsUsed };

