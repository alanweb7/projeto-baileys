// src/utils/logger.js

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, errors, json } = format;

// Formato customizado de log
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase()}] ${stack || message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }), // loga stacktrace em erros
    json() // pode trocar por logFormat se quiser logs em texto legível
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

module.exports = logger;
