/**
 * Cria um middleware de validação de requisições usando Joi, 
 * garantindo que a estrutura da mensagem esteja correta antes de ser 
 * processada (evitando erros em tempo de execução ou dados malformados).
 */

// Importa a biblioteca Joi, usada para validação de dados
const Joi = require('joi');

// Define o esquema de validação da estrutura da requisição
const messageSchema = Joi.object({
  // A propriedade `queue` deve ser uma string obrigatória (nome da fila)
  queue: Joi.string().required(),

  // A propriedade `message` deve ser um objeto com estrutura obrigatória
  message: Joi.object({
    // `id` deve ser uma string obrigatória (identificador único da mensagem)
    id: Joi.string().required(),

    // `content` deve ser uma string obrigatória (conteúdo da mensagem)
    content: Joi.string().required(),

    // `timestamp` deve ser uma string no formato ISO de data/hora
    timestamp: Joi.string().isoDate().required(),

    // `metadata` deve ser um objeto com informações adicionais obrigatórias
    metadata: Joi.object({
      // `sender` é obrigatório (quem enviou a mensagem)
      sender: Joi.string().required(),

      // `priority` deve ser uma das três opções válidas e obrigatórias
      priority: Joi.string().valid('high', 'medium', 'low').required()
    }).required()
  }).required()
});

// Middleware de validação que será usado nas rotas
function validateMessage(req, res, next) {
  // Valida o corpo da requisição com base no esquema definido
  const { error } = messageSchema.validate(req.body);

  // Se houver erro na validação, responde com status 400 e mensagem do erro
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  // Se a validação for bem-sucedida, continua para o próximo middleware ou controller
  next();
}

// Exporta a função de middleware para ser usada na aplicação
module.exports = { validateMessage };
