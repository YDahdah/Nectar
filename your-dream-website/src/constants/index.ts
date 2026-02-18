/**
 * Application-wide constants
 * Centralizes magic numbers and strings for better maintainability
 */

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.perfumenectar.com',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 24,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

/**
 * Cart configuration
 */
export const CART = {
  MAX_QUANTITY: 100,
  MIN_QUANTITY: 1,
  STORAGE_KEY: 'nectar_cart',
  CHECKOUT_SAVED_KEY: 'nectar_checkout_saved',
} as const;

/**
 * Order configuration
 */
export const ORDER = {
  STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  } as const,
  PAYMENT_METHODS: {
    CASH_ON_DELIVERY: 'Cash on Delivery',
    CREDIT_CARD: 'Credit Card',
    BANK_TRANSFER: 'Bank Transfer',
  } as const,
  SHIPPING_METHODS: {
    EXPRESS: 'Express Delivery (2-3 Working Days)',
    STANDARD: 'Standard Delivery (5-7 Working Days)',
  } as const,
} as const;

/**
 * Validation rules
 */
export const VALIDATION = {
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z\s'-]+$/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 255,
  },
  PHONE: {
    LEBANESE_LENGTH: 8,
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
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_NAME: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  CART_EMPTY: 'Your cart is empty',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  ORDER_PLACED: 'Order placed successfully',
  ITEM_ADDED: 'Item added to cart',
  ITEM_REMOVED: 'Item removed from cart',
  CART_CLEARED: 'Cart cleared',
  NEWSLETTER_SUBSCRIBED: 'Successfully subscribed to newsletter',
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  CART: 'nectar_cart',
  CHECKOUT: 'nectar_checkout_saved',
  USER_PREFERENCES: 'nectar_user_preferences',
} as const;

/**
 * Route paths
 */
export const ROUTES = {
  HOME: '/',
  SHOP: '/shop',
  PRODUCT: (id: string) => `/product/${id}`,
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDER_CONFIRMATION: '/order-confirmation',
  NOT_FOUND: '*',
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Debounce delays (in milliseconds)
 */
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  FORM_VALIDATION: 500,
  RESIZE: 250,
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

/**
 * Product display limits
 */
export const FEATURED_PRODUCTS_LIMIT = 8;
export const SHOP_PAGE_SIZE = 24;
