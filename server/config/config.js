import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

/**
 * Validate required environment variables
 */
function validateEnv() {
  const required = [];
  const optional = [
    'PORT',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'GMAIL_USER',
    'GMAIL_APP_PASSWORD',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REFRESH_TOKEN',
    'OWNER_PHONE',
    'ORDER_EMAIL',
    'FRONTEND_URL',
    'NODE_ENV'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.warn(`Missing optional environment variables: ${missing.join(', ')}`);
  }

  // Log configuration status
  logger.info('Environment Configuration:');
  optional.forEach(key => {
    const value = process.env[key];
    if (value) {
      // Mask sensitive values
      if (key.includes('PASSWORD') || key.includes('TOKEN') || key.includes('SECRET')) {
        logger.info(`  ${key}: ${'*'.repeat(Math.min(value.length, 8))}`);
      } else {
        logger.info(`  ${key}: ${value}`);
      }
    } else {
      logger.info(`  ${key}: Not set`);
    }
  });

  // Warn if email is still placeholder (prevents EAUTH on first order)
  const emailUser = process.env.EMAIL_USER || '';
  if (emailUser && (emailUser.includes('your-email') || emailUser.toLowerCase().includes('example.com'))) {
    logger.warn('⚠️ EMAIL_USER looks like a placeholder. Replace with your real Gmail and use an App Password (see server/EMAIL_SETUP.md)');
  }
}

const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Email
  email: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD,
    orderEmail: process.env.ORDER_EMAIL || process.env.EMAIL_USER,
    shopName: process.env.SHOP_NAME || 'Nectar Perfume Shop'
  },
  
  // Owner
  ownerPhone: process.env.OWNER_PHONE || '+96181353685',
  
  // Security – allowed frontend origins (sites that can call this API)
  security: {
    corsOrigins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : [
          'http://localhost:5173',
          'http://localhost:8080',
          'http://localhost:3000',
          'https://perfumenectar.com',
          'https://www.perfumenectar.com',
        ],
    apiKey: process.env.API_KEY,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10) * 60 * 1000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10) 
  }
};
validateEnv();

export default config;