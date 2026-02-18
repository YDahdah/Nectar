/**
 * Utility helper functions for common operations
 */

import { ERROR_MESSAGES } from './constants.js';

/**
 * Sanitize string input by trimming and removing dangerous characters
 * @param {string} input - Input string to sanitize
 * @param {Object} options - Sanitization options
 * @param {boolean} options.trim - Whether to trim whitespace (default: true)
 * @param {boolean} options.removeHtml - Whether to remove HTML tags (default: true)
 * @returns {string} Sanitized string
 */
export function sanitizeString(input, options = {}) {
  const { trim = true, removeHtml = true } = options;
  
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  if (trim) {
    sanitized = sanitized.trim();
  }

  if (removeHtml) {
    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    // Escape HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  return sanitized;
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email.trim());
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if phone is valid
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  const phonePattern = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phonePattern.test(phone.trim());
}

/**
 * Generate a unique order ID
 * @returns {string} Unique order ID in format ORD-{timestamp}-{random}
 */
export function generateOrderId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
}

/**
 * Calculate order total from items and shipping cost
 * @param {Array} items - Array of order items with price and quantity
 * @param {number} shippingCost - Shipping cost
 * @returns {number} Total price rounded to 2 decimal places
 */
export function calculateOrderTotal(items, shippingCost = 0) {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }

  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return sum + (price * quantity);
  }, 0);

  const total = subtotal + (Number(shippingCost) || 0);
  
  // Round to 2 decimal places to avoid floating point issues
  return Math.round(total * 100) / 100;
}

/**
 * Validate that calculated total matches provided total (within tolerance)
 * @param {number} calculatedTotal - Calculated total price
 * @param {number} providedTotal - Provided total price
 * @param {number} tolerance - Allowed difference (default: 0.01)
 * @returns {boolean} True if totals match within tolerance
 */
export function validateTotalPrice(calculatedTotal, providedTotal, tolerance = 0.01) {
  const difference = Math.abs(calculatedTotal - providedTotal);
  return difference <= tolerance;
}

/**
 * Safely parse JSON with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed object or default value
 */
export function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Format error message for client consumption
 * @param {Error} error - Error object
 * @param {boolean} includeStack - Whether to include stack trace
 * @returns {Object} Formatted error object
 */
export function formatError(error, includeStack = false) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    ...(includeStack && isDevelopment && { stack: error.stack }),
    ...(error.statusCode && { statusCode: error.statusCode }),
  };
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - Value to check
 * @returns {boolean} True if value is empty
 */
export function isEmpty(value) {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
}

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * Delay execution by specified milliseconds
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise} Promise that resolves with function result
 */
export async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delayMs = initialDelay * Math.pow(2, attempt);
        await delay(delayMs);
      }
    }
  }
  
  throw lastError;
}
