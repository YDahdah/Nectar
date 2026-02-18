/**
 * Server-side constants
 * Centralizes magic numbers and strings for better maintainability
 */

/**
 * HTTP Status Codes
 */
export export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Rate Limiting Configuration
 */
export const RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  CHECKOUT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5,
  },
  NEWSLETTER: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 10,
  },
};

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
};

/**
 * Order Configuration
 */
export const ORDER_CONFIG = {
  STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  },
  PAYMENT_METHODS: {
    CASH_ON_DELIVERY: 'Cash on Delivery',
    CREDIT_CARD: 'Credit Card',
    BANK_TRANSFER: 'Bank Transfer',
  },
  SHIPPING_METHODS: {
    EXPRESS: 'Express Delivery (2-3 Working Days)',
    STANDARD: 'Standard Delivery (5-7 Working Days)',
  },
  MAX_ITEMS: 50,
  MIN_ITEMS: 1,
};

/**
 * Validation Rules
 */
export const VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z\s'-]+$/,
  },
  EMAIL: {
    MAX_LENGTH: 255,
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PHONE: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 20,
    PATTERN: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
  },
  ADDRESS: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 500,
  },
  CITY: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
};

/**
 * Cache TTL (Time To Live) in milliseconds
 */
export const CACHE_TTL = {
  PRODUCTS: 5 * 60 * 1000, // 5 minutes
  ORDERS: 60 * 1000, // 1 minute
  NEWSLETTER: 60 * 1000, // 1 minute
  DEFAULT: 5 * 60 * 1000, // 5 minutes
};

/**
 * Database Configuration
 */
export const DB_CONFIG = {
  POOL: {
    MIN: process.env.DB_POOL_MIN || 2,
    MAX: process.env.DB_POOL_MAX || 10,
    IDLE_TIMEOUT: 30000, // 30 seconds
    CONNECTION_TIMEOUT: 5000, // 5 seconds
  },
  STATEMENT_TIMEOUT: 30000, // 30 seconds
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Validation failed',
  RESOURCE_NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  TOO_MANY_REQUESTS: 'Too many requests, please try again later',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service unavailable',
  INVALID_PHONE: 'Invalid phone number format',
  INVALID_EMAIL: 'Invalid email address',
  ORDER_NOT_FOUND: 'Order not found',
  CART_EMPTY: 'Cart is empty',
};

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  ORDER_CREATED: 'Order placed successfully',
  NEWSLETTER_SUBSCRIBED: 'Successfully subscribed to newsletter',
  EMAIL_SENT: 'Email sent successfully',
};

/**
 * Request Size Limits
 */
export const REQUEST_LIMITS = {
  JSON: '10mb',
  URL_ENCODED: '10mb',
  FILE_UPLOAD: '5mb',
};

/**
 * Logging Levels
 */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

/**
 * Health Check Configuration
 */
export const HEALTH_CHECK = {
  TIMEOUT: 5000, // 5 seconds
  INTERVAL: 30000, // 30 seconds
};
