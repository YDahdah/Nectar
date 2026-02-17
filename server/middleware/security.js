import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import config from "../config/config.js";
import logger from "../utils/logger.js";
import { redisClient, redisAvailable } from "./cache.js";

/**
 * Get Redis store for rate limiting if available, otherwise use memory store
 * This ensures distributed rate limiting across multiple instances
 * Note: Redis client initialization is async, so we check availability at store creation time
 */
function getRateLimitStore(prefix) {
  // Check if Redis is available (may be false if Redis is still initializing or unavailable)
  if (redisAvailable && redisClient) {
    try {
      const store = new RedisStore({
        client: redisClient,
        prefix: `rl:${prefix}:`,
        // Send command to Redis to ensure connection is ready
        sendCommand: (...args) => redisClient.sendCommand(args),
      });
      logger.info(`Using Redis store for rate limiting: ${prefix}`);
      return store;
    } catch (error) {
      logger.warn(`Failed to create Redis store for rate limiting, using memory store: ${error.message}`);
    }
  } else {
    logger.debug(`Redis not available for rate limiting (${prefix}), using memory store`);
  }
  // Fallback to memory store if Redis is not available
  return undefined; // undefined means use default memory store
}

/**
 * CORS configuration – allow all origins (required for browser requests from other origins).
 * If you use nginx in front of this app, proxy /api and /health to Node so this middleware can add CORS headers.
 */
export const corsMiddleware = cors({
  origin: true, // reflect request Origin (e.g. http://localhost:8080 or https://perfumenectar.com)
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  optionsSuccessStatus: 204, // some clients expect 204 for OPTIONS
});

/**
 * Rate limiting middleware
 * Uses Redis store if available for distributed rate limiting across instances
 * Falls back to memory store if Redis is unavailable
 * Skip OPTIONS requests (CORS preflight) to avoid blocking them
 */
export const rateLimiter = rateLimit({
  store: getRateLimitStore("general"),
  windowMs: config.security.rateLimitWindow,
  max: config.security.rateLimitMax,
  skip: (req) => req.method === "OPTIONS", // Skip preflight requests
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: "Too many requests from this IP, please try again later.",
    });
  },
});

/**
 * Strict rate limiter for checkout endpoint
 * Uses Redis store if available for distributed rate limiting across instances
 * Skip OPTIONS requests (CORS preflight) to avoid blocking them
 */
export const checkoutRateLimiter = rateLimit({
  store: getRateLimitStore("checkout"),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 orders per 15 minutes
  skip: (req) => req.method === "OPTIONS", // Skip preflight requests
  message: {
    success: false,
    error: "Too many checkout attempts. Please wait before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Checkout rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: "Too many checkout attempts. Please wait before trying again.",
    });
  },
});

/**
 * Rate limiter for newsletter signup
 * Uses Redis store if available for distributed rate limiting across instances
 * Skip OPTIONS requests (CORS preflight) to avoid blocking them
 */
export const newsletterRateLimiter = rateLimit({
  store: getRateLimitStore("newsletter"),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 signups per 15 minutes per IP
  skip: (req) => req.method === "OPTIONS", // Skip preflight requests
  message: {
    success: false,
    error: "Too many signup attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Newsletter rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: "Too many signup attempts. Please try again later.",
    });
  },
});

/**
 * Helmet security headers
 * Configured to not interfere with CORS headers
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
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin requests
  crossOriginOpenerPolicy: false, // Don't block cross-origin windows
});

/**
 * Request size limit middleware
 */
export function requestSizeLimit(maxSize = "10mb") {
  return (req, res, next) => {
    const contentLength = req.get("content-length");
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      const maxSizeInMB = parseFloat(maxSize);

      if (sizeInMB > maxSizeInMB) {
        logger.warn(
          `Request too large from IP: ${req.ip}, Size: ${sizeInMB.toFixed(2)}MB`,
        );
        return res.status(413).json({
          success: false,
          error: `Request payload too large. Maximum size is ${maxSize}`,
        });
      }
    }
    next();
  };
}
