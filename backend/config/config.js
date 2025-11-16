require('dotenv').config();

const config = {
  // Server configuration
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // CORS configuration (supports comma-separated origins)
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:3001'],

  // Rate limiting
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,

  // Security
  trustProxy: process.env.TRUST_PROXY === 'true',

  // Scraping configuration
  scrapingTimeout: parseInt(process.env.SCRAPING_TIMEOUT) || 30000,
  maxContentLength: parseInt(process.env.MAX_CONTENT_LENGTH) || 4000,

  // AI provider configuration
  maxTokens: parseInt(process.env.MAX_TOKENS) || 4096,
};

// Validate required environment variables
const validateConfig = () => {
  const errors = [];

  if (config.port < 1 || config.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  if (!['development', 'production', 'test'].includes(config.nodeEnv)) {
    errors.push('NODE_ENV must be development, production, or test');
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  return true;
};

validateConfig();

module.exports = config;
