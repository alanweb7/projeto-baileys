# 📬 Projeto Baileys – Gateway de Mensagens com Node.js, Baileys e RabbitMQ

Este projeto é um gateway de mensageria assíncrona desenvolvido com Node.js, utilizando a biblioteca **Baileys** para envio e recebimento de mensagens para **RabbitMQ** como broker de mensagens.

---

## 📌 Visão Geral

A aplicação expõe uma **API REST** para envio de mensagens, utilizando uma arquitetura baseada em filas (**RabbitMQ**) para garantir uma comunicação assíncrona, escalável e confiável entre os microserviços.

---

## 🎯 Objetivos

- Integrar **RabbitMQ** com **Node.js**
- Utilizar **Baileys** para gerenciar envio e consumo de mensagens de forma assíncrona
- Criar endpoints RESTful com **Express**

---

## 🧰 Tecnologias Utilizadas

- Node.js 16+
- Express.js
- Baileys
- RabbitMQ
- amqplib
- Docker

---

## 💻 Instalação em uma VPS (Ubuntu 20.04+)

### ✅ Pré-requisitos

- Node.js 16+
- Docker
- RabbitMQ instalado (Docker)
- Git
- UUID

### 🔧 Passo a passo


### Instale pacotes necessários

```bash
sudo apt update && sudo apt install -y git curl build-essential

# Instale Node.js 16+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# reinicie o servidor
reboot now

```
## 📦 Instalação do uuid

```bash
sudo apt update
npm install uuid
reboot now
```

## Instalando Docker no Ubuntu

```bash
sudo apt update && \
sudo apt install -y docker.io && \
sudo systemctl enable docker && \
sudo systemctl start docker
```

## Verifique se o Docker está funcionando:

```bash
docker --version
```

## Rodando o RabbitMQ com management:

```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

```
---

## 📦 Instalar Redis
```bash
npm install redis && \
sudo apt install -y redis-tools redis-server && \
sudo systemctl start redis-server && \
sudo systemctl enable redis-server 

```

## Verifique se o Redis está funcionando
```bash
redis-cli ping
 ```
 * Esperado: PONG

---

## 📦 📦 Clone e configure o projeto
```bash
git clone https://github.com/alanweb7/projeto-baileys.git
cd projeto-baileys

# Instale dependências
npm install

# Configure o .env
cp .env.example .env
nano .env

# Inicie a aplicação
npm start
```

---

## 🛠 (Opcional) Rodar como serviço com PM2

```bash
npm install -g pm2
pm2 start src/app.js --name projeto-baileys
pm2 save
pm2 startup
```

---

# 📩 Exemplos de uso

## 📩 API: Enviar Mensagens

### ➔ Rota

```http
POST /api/messages/send
```

### 📄 Descrição

Recebe mensagens via HTTP e envia para uma fila RabbitMQ.\
O processamento da fila é feito de forma assíncrona por um consumer.

---

### 📅 Exemplo de payload de Entrada

```json
{
  "queue": "nome_da_fila",
  "message": {
    "id": "unique_message_id", //:uniq | rand (gerar uniq aleatório)
    "content": "conteúdo da mensagem",
    "timestamp": "2024-01-15T10:30:00Z",
    "metadata": {
      "sender": "service_name",
      "priority": "high"
    }
  }
}
```

### 🧾 Estrutura do Payload

| Campo                       | Tipo                             | Obrigatório | Descrição                            |
| --------------------------- | -------------------------------- | ----------- | ------------------------------------ |
| `queue`                     | string                           | ✅           | Nome da fila RabbitMQ                |
| `message.id`                | string                           | ✅           | ID único ou 'rand'                  |
| `message.content`           | string                           | ✅           | Conteúdo da mensagem                 |
| `message.timestamp`         | string (ISO 8601)                | ✅           | Data/hora da criação da mensagem     |
| `message.metadata.sender`   | string                           | ✅           | Nome do serviço que gerou a mensagem |
| `message.metadata.priority` | string (`high`, `medium`, `low`) | ✅           | Prioridade da mensagem               |

---

### ✅ Exemplo de Resposta

```json
{
  "success": true,
  "messageId": "unique_message_id",
  "queueName": "nome_da_fila",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

# 📡 API de Monitoramento de Filas RabbitMQ.

Este serviço expõe um endpoint HTTP para consultar o status de uma ou mais filas no RabbitMQ, utilizando o canal AMQP e (opcionalmente) a API de gerenciamento do RabbitMQ.

---

## 🔍 Consulta de Status das Filas

### 📥 Endpoint

```bash
GET /api/queues/status
```

### 🔧 Parâmetros de Query

| Parâmetro | Descrição |
|-----------|-----------|
| `queues`  | (opcional) Lista separada por vírgulas com os nomes das filas a consultar. Omitir o parâmetro para retornar todas as filas disponíveis. |

---

### ✅ Exemplos de Uso

- Consultar filas específicas:

```bash
GET /api/queues/status?queues=mensagens,empresas
```

- Consultar **todas as filas existentes**:

```bash
GET /api/queues/status
```


### 📤 Exemplo de Resposta

```json
{
  "success": true,
  "queues": [
    {
      "name": "mensagens",
      "messageCount": 2,
      "consumerCount": 1,
      "isActive": true
    },
    {
      "name": "empresas",
      "messageCount": 0,
      "consumerCount": 0,
      "isActive": false
    }
  ],
  "rabbitMQStatus": "connected",
  "timestamp": "2025-07-17T14:00:00.000Z"
}
```
---

## 📂 Estrutura do Projeto

```bash
projeto-baileys/
├── src/
│   ├── controllers/      
│   ├── services/             
│   ├── middleware/          
│   ├── config/         
│   ├── utils/  
│   └── app.js     
├── tests/                 
├── docker/           
├── docs/      
├── .env.example        
├── .gitignore
├── package.json
└── README.md
```