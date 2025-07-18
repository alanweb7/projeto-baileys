// controllers/queueController.js
const { connectRabbitMQ } = require('../config/rabbitmq');
const axios = require('axios');

// Lista todas as filas via API HTTP do Management Plugin
async function listAllQueues() {
    const {
        RABBITMQ_HOST,
        RABBITMQ_PORT_MANAGEMENT,
        RABBITMQ_USER,
        RABBITMQ_PASS
    } = process.env;

    const managementUrl = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT_MANAGEMENT}/api/queues`;

    try {
        const response = await axios.get(managementUrl, {
            auth: {
                username: RABBITMQ_USER,
                password: RABBITMQ_PASS
            }
        });

        return response.data.map((q) => q.name);
    } catch (error) {
        console.error('Erro ao buscar todas as filas via Management Plugin:', error.message);
        throw error;
    }
}

async function queueStatus(req, res) {
    let channel;
    try {
        channel = await connectRabbitMQ();

        channel.on('error', (err) => {
            console.error('Erro no canal RabbitMQ:', err.message);
        });

        let queueNames = [];

        if (req.query.queues) {
            const requested = req.query.queues.trim().toLowerCase();
            queueNames = requested.split(',');

        } else {
            queueNames = await listAllQueues(); // Chamada correta aqui dentro
        }

        const queueStatuses = [];

        for (const name of queueNames) {
            try {
                const { messageCount, consumerCount } = await channel.checkQueue(name);

                queueStatuses.push({
                    name,
                    messageCount,
                    consumerCount,
                    isActive: consumerCount > 0 || messageCount > 0
                });
            } catch (error) {
                console.warn(`Erro ao verificar a fila '${name}':`, error.message);
                queueStatuses.push({
                    name,
                    messageCount: 0,
                    consumerCount: 0,
                    isActive: false,
                    error: 'Fila não encontrada ou erro ao verificar'
                });
            }
        }

        return res.json({
            success: true,
            queues: queueStatuses,
            rabbitMQStatus: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro geral ao buscar status das filas:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Erro ao conectar ou processar status das filas',
        });
    }
}

module.exports = { queueStatus };
