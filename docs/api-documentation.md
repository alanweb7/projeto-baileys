
# Projeto Baileys - Integração com RabbitMQ

Este projeto implementa a integração com RabbitMQ utilizando a biblioteca `baileys`. A seguir está a estrutura do projeto, responsabilidades de cada parte, e os principais pontos implementados.

## Estrutura do Projeto

```
projeto-baileys/
├── src/
│   ├── controllers/
│   │   ├── messageController.js       # Responsável por envio de mensagens para filas RabbitMQ
│   │   └── queueController.js         # Responsável por obter status das filas via API e Management Plugin
│   ├── services/
│   │   ├── baileysService.js           # Inicializa e exporta uma instância do Baileys configurado
│   │   └── rabbitMQService.js         # Serviços auxiliares para comunicação com RabbitMQ
│   ├── middleware/
│   │   ├── validation.js              # Middleware para validações de entrada
│   │   ├── errorHandler.js            # Middleware de tratamento de erros
│   │   └── rateLimiter.js             # Middleware de limite de requisições
│   ├── config/
│   │   ├── database.js                # (Opcional) Configurações de banco de dados
│   │   └── rabbitmq.js                # Função de conexão com o RabbitMQ
│   ├── utils/
│   │   └── logger.js                  # Utilitário para logging estruturado
│   └── app.js                         # Arquivo principal da aplicação (Express, middlewares e rotas)
├── tests/
│   ├── unit/                          # Testes unitários (em construção)
│   └── integration/                   # Testes de integração (em construção)
├── docker/
│   ├── Dockerfile                     # Imagem da aplicação
│   └── docker-compose.yml             # Orquestra aplicação e serviços como RabbitMQ
├── docs/
│   └── api-documentation.md          # Documentação da API
├── .env.example                       # Exemplo de variáveis de ambiente
├── .gitignore                         # Arquivos ignorados pelo Git
├── package.json                       # Dependências e scripts da aplicação
└── README.md                          # Instruções do projeto
```

## Funcionalidades Implementadas

### ✅ Conexão com RabbitMQ usando Baileys
- Configuração em `services/baileysService.js`
- Usa variáveis de ambiente para `host`, `port`, `user`, `pass`, `vhost`, etc.

### ✅ Envio de mensagens
- `messageController.js` utiliza o Baileys para enviar mensagens para filas nomeadas.

### ✅ Status das Filas
- API `GET /api/queues/status` com suporte a:
  ```bash
  /api/queues/status?queues=mensagens,empresas
  /api/queues/status?queues=all
  /api/queues/status  # retorna por padrão a fila 'mensagens'
  ```
- Usa o Management Plugin do RabbitMQ (porta 15672) via `axios`.

### ✅ Tratamento de Erros
- Falha de conexão
- Fila inexistente
- Mensagem inválida
- Timeout
- Limite de conexões

### ✅ Logging e Monitoramento
- Todas as ações importantes são logadas via `utils/logger.js`

## Possibilidades Futuras

- [ ] Adicionar testes automatizados em `/tests/unit/`
- [ ] Expandir `docs/api-documentation.md` com exemplos completos
- [ ] Incluir métricas de performance e status em tempo real

---

© Projeto Baileys – Monitoramento e Integração RabbitMQ


## Uso da API de Status de Filas

A API permite consultar o status das filas monitoradas pelo sistema Baileys.

### Rotas disponíveis

```bash
GET /api/queues/status?queues=mensagens,empresas
```

Retorna o status apenas das filas `mensagens` e `empresas`.

```bash
GET /api/queues/status
```

Retorna o status de **todas as filas** disponíveis no RabbitMQ.

---

### Exemplo de resposta:

```json
{
  "mensagens": {
    "messages": 3,
    "consumers": 1,
    "state": "running"
  },
  "empresas": {
    "messages": 0,
    "consumers": 2,
    "state": "idle"
  }
}
```
