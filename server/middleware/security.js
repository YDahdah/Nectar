import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from '../config/config.js';
import logger from '../utils/logger.js';

/**
 * CORS configuration – allow all origins
 */
export const corsMiddleware = cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
});

/**
 * Rate limiting middleware
 */
export const rateLimiter = rateLimit({
  windowMs: config.security.rateLimitWindow,
  max: config.security.rateLimitMax,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.'
    });
  }
});

/**
 * Strict rate limiter for checkout endpoint
 */
export const checkoutRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 orders per 15 minutes
  message: {
    success: false,
    error: 'Too many checkout attempts. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Checkout rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many checkout attempts. Please wait before trying again.'
    });
  }
});

/**
 * Rate limiter for newsletter signup
 */
export const newsletterRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 signups per 15 minutes per IP
  message: {
    success: false,
    error: 'Too many signup attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Newsletter rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many signup attempts. Please try again later.'
    });
  }
});

/**
 * Helmet security headers
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
});

/**
 * Request size limit middleware
 */
export function requestSizeLimit(maxSize = '10mb') {
  return (req, res, next) => {
    const contentLength = req.get('content-length');
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      const maxSizeInMB = parseFloat(maxSize);
      
      if (sizeInMB > maxSizeInMB) {
        logger.warn(`Request too large from IP: ${req.ip}, Size: ${sizeInMB.toFixed(2)}MB`);
        return res.status(413).json({
          success: false,
          error: `Request payload too large. Maximum size is ${maxSize}`
        });
      }
    }
    next();
  };
}
