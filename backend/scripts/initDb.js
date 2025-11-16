require('dotenv').config();
const { sequelize, testConnection, syncDatabase } = require('../config/database');
const { logger } = require('../utils/logger');

// Import models to ensure they're registered
require('../models');

async function initializeDatabase() {
  try {
    logger.info('Starting database initialization...');

    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Sync database
    // WARNING: { force: true } will drop all tables and recreate them
    // Use { alter: true } for safer migrations in development
    // In production, use proper migrations
    const syncOptions = process.argv.includes('--force')
      ? { force: true }
      : { alter: true };

    logger.info(`Syncing database with options:`, syncOptions);

    await syncDatabase(syncOptions);

    logger.info('Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Database initialization failed', { error: error.message });
    console.error(error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
