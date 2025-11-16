const morgan = require('morgan');
const config = require('../config/config');

// Custom token for morgan to log response time with color
morgan.token('status-color', (req, res) => {
  const status = res.statusCode;
  if (status >= 500) return `\x1b[31m${status}\x1b[0m`; // Red
  if (status >= 400) return `\x1b[33m${status}\x1b[0m`; // Yellow
  if (status >= 300) return `\x1b[36m${status}\x1b[0m`; // Cyan
  return `\x1b[32m${status}\x1b[0m`; // Green
});

// Custom format for development
const devFormat = ':method :url :status-color :response-time ms - :res[content-length]';

// Custom format for production (JSON)
const productionFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time',
  contentLength: ':res[content-length]',
  remoteAddr: ':remote-addr',
  userAgent: ':user-agent',
});

// Logger middleware
const requestLogger = config.nodeEnv === 'production'
  ? morgan(productionFormat)
  : morgan(devFormat);

// Simple console logger for custom messages
const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${message}`, meta);
  },
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${message}`, meta);
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${message}`, meta);
  },
  debug: (message, meta = {}) => {
    if (config.nodeEnv === 'development') {
      console.debug(`[DEBUG] ${message}`, meta);
    }
  },
};

module.exports = {
  requestLogger,
  logger,
};
