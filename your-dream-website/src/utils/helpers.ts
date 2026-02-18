/**
 * Frontend utility helper functions
 */

import { ERROR_MESSAGES, VALIDATION } from '@/constants';

/**
 * Sanitize string input by trimming and removing dangerous characters
 * @param input - Input string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized string
 */
export function sanitizeString(
  input: string,
  options: { trim?: boolean; removeHtml?: boolean } = {}
): string {
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
 * @param email - Email address to validate
 * @returns True if email is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  return VALIDATION.EMAIL.PATTERN.test(email.trim());
}

/**
 * Validate phone number format
 * @param phone - Phone number to validate
 * @returns True if phone is valid
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  return VALIDATION.PHONE.PATTERN.test(phone.trim());
}

/**
 * Format phone number for display
 * @param phone - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhone(phone: string): string {
  if (!phone) {
    return '';
  }

  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length === 8) {
    // Lebanese format: XX XXX XXX
    return `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 5)} ${digitsOnly.slice(5)}`;
  }

  return phone;
}

/**
 * Format currency amount
 * @param amount - Amount to format
 * @param currency - Currency symbol (default: '$')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = '$'): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `${currency}0.00`;
  }

  return `${currency}${amount.toFixed(2)}`;
}

/**
 * Safely parse JSON with error handling
 * @param jsonString - JSON string to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed object or default value
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Debounce function execution
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function execution
 * @param fn - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param value - Value to check
 * @returns True if value is empty
 */
export function isEmpty(value: unknown): boolean {
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
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

/**
 * Generate a unique ID
 * @returns Unique ID string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format error message for display
 * @param error - Error object or string
 * @returns Formatted error message
 */
export function formatError(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Sleep/delay function
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Type guard to check if value is a string
 * @param value - Value to check
 * @returns True if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if value is a number
 * @param value - Value to check
 * @returns True if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if value is an array
 * @param value - Value to check
 * @returns True if value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}
