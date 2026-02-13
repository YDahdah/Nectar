/**
 * Basic HTML entity encoding to prevent XSS attacks
 */
function encodeHtmlEntities(str) {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };
  return String(str).replace(/[&<>"'\/]/g, (s) => entityMap[s]);
}

/**
 * Sanitize string input to prevent XSS attacks
 * Note: Joi validation already handles most sanitization, this is an extra layer
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Remove HTML tags and encode special characters
  return encodeHtmlEntities(input.replace(/<[^>]*>/g, ''));
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}
