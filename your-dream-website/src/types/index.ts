/**
 * Shared TypeScript types and interfaces for the Nectar application
 */

/**
 * Product interface
 */
export interface Product {
  id: string;
  name: string;
  brand: string;
  gender: 'men' | 'women' | 'unisex';
  price: number;
  size: string;
  image: string;
  description?: string;
  stock?: number;
}

/**
 * Cart item interface
 */
export interface CartItem {
  id: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  image?: string;
}

/**
 * Order interface
 */
export interface Order {
  orderId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  caza: string;
  country: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  totalPrice: number;
  paymentMethod: string;
  shippingMethod: string;
  notes?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt?: Date;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Form validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[] | null;
}

/**
 * Checkout form data
 */
export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  caza: string;
  phone: string;
  email: string;
  country?: string;
}

/**
 * Newsletter subscription data
 */
export interface NewsletterSubscription {
  email: string;
  name?: string;
}

/**
 * Environment configuration
 */
export interface AppConfig {
  apiBaseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
}
