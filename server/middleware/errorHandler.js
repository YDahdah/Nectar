import logger from '../utils/logger.js';

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
  const corsOrigins = [
    "http://localhost:8080",
    "https://perfumenectar.com",
    "https://www.perfumenectar.com",
    "https://api.perfumenectar.com",
  ];

  // Normalize and check origin
  if (origin) {
    const normalizedOrigin = origin.replace(/\/$/, "").toLowerCase();
    const isAllowed = corsOrigins.some(allowed => {
      const normalizedAllowed = allowed.replace(/\/$/, "").toLowerCase();
      return normalizedOrigin === normalizedAllowed ||
        normalizedOrigin === normalizedAllowed.replace(/^https:\/\//, "https://www.") ||
        normalizedOrigin === normalizedAllowed.replace(/^https:\/\/www\./, "https://");
    });

    if (isAllowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
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
