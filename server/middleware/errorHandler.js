import logger from '../utils/logger.js';
import config from '../config/config.js';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Add CORS headers to response
 * CRITICAL: Error responses MUST include CORS headers or browser will block them
 */
function addCorsHeaders(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = config.security?.corsOrigins || [
    "https://perfumenectar.com",
    "https://www.perfumenectar.com",
    "http://localhost:5173",
    "http://localhost:3000",
  ];

  if (origin) {
    const normalizedOrigin = origin.replace(/\/$/, "").toLowerCase();
    const isAllowed = allowedOrigins.some(allowed => {
      const normalizedAllowed = (allowed || "").replace(/\/$/, "").toLowerCase();
      return normalizedOrigin === normalizedAllowed;
    });
    if (isAllowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
    }
  }
}

/**
 * Error handling middleware
 * IMPORTANT: Must add CORS headers to error responses
 */
export function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ApiError(404, message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field} already exists`;
    error = new ApiError(400, message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    const message = `Validation Error: ${messages.join(', ')}`;
    error = new ApiError(400, message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new ApiError(401, message);
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new ApiError(401, message);
  }

  // ReferenceError (undefined variable) - don't expose internal errors
  if (err.name === 'ReferenceError') {
    logger.error('ReferenceError detected:', {
      message: err.message,
      stack: err.stack,
      variable: err.message.match(/(\w+) is not defined/)?.[1],
      url: req.originalUrl
    });
    // Don't expose the actual variable name to client for security
    const message = 'Server error occurred while processing your order. Please try again or contact support.';
    error = new ApiError(500, message);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // CRITICAL: Add CORS headers to error responses
  // Without this, browser will block error responses even if preflight succeeded
  addCorsHeaders(req, res);

  // Don't expose internal error details in production
  const response = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(statusCode).json(response);
}

/**
 * 404 handler
 */
export function notFoundHandler(req, res, next) {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
}
