import logger from "../utils/logger.js";

/**
 * Simple in-memory cache middleware
 * Used as fallback when Redis is not available
 */
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Clean up expired entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

const memoryCache = new MemoryCache();

// Cleanup expired entries every 10 minutes
setInterval(() => {
  memoryCache.cleanup();
}, 10 * 60 * 1000);

/**
 * Redis cache client with automatic fallback to memory cache
 * Supports distributed caching for horizontal scaling
 */
let redisClient = null;
let redisAvailable = false;

/**
 * Initialize Redis client if REDIS_URL is configured
 * Falls back to memory cache if Redis is unavailable
 */
async function initRedis() {
  if (redisClient !== null) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.info("Redis not configured, using in-memory cache");
    redisAvailable = false;
    return null;
  }

  try {
    const { createClient } = await import("redis");
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error("Redis reconnection failed after 10 attempts, falling back to memory cache");
            redisAvailable = false;
            return new Error("Redis connection failed");
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on("error", (err) => {
      logger.error("Redis client error:", err);
      redisAvailable = false;
    });

    redisClient.on("connect", () => {
      logger.info("Redis client connected");
      redisAvailable = true;
    });

    redisClient.on("reconnecting", () => {
      logger.warn("Redis client reconnecting...");
    });

    await redisClient.connect();
    redisAvailable = true;
    logger.info("Redis cache initialized successfully");
    return redisClient;
  } catch (error) {
    logger.warn("Failed to initialize Redis, falling back to memory cache:", error.message);
    redisAvailable = false;
    return null;
  }
}

// Initialize Redis on module load
initRedis().catch((err) => {
  logger.warn("Redis initialization error:", err.message);
});

/**
 * Get cache value from Redis or memory cache
 */
async function getCacheValue(key) {
  if (redisAvailable && redisClient) {
    try {
      const value = await redisClient.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      logger.error("Redis get error:", error);
      redisAvailable = false;
      // Fallback to memory cache
      return memoryCache.get(key);
    }
  }
  return memoryCache.get(key);
}

/**
 * Set cache value in Redis or memory cache
 */
async function setCacheValue(key, value, ttlMs) {
  if (redisAvailable && redisClient) {
    try {
      const ttlSeconds = Math.floor(ttlMs / 1000);
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      return;
    } catch (error) {
      logger.error("Redis set error:", error);
      redisAvailable = false;
      // Fallback to memory cache
      memoryCache.set(key, value, ttlMs);
      return;
    }
  }
  memoryCache.set(key, value, ttlMs);
}

/**
 * Delete cache value from Redis or memory cache
 */
async function deleteCacheValue(key) {
  if (redisAvailable && redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch (error) {
      logger.error("Redis delete error:", error);
      redisAvailable = false;
      memoryCache.delete(key);
      return;
    }
  }
  memoryCache.delete(key);
}

/**
 * Cache middleware for Express routes
 * Uses Redis if available, falls back to memory cache
 * 
 * Usage:
 *   app.get('/api/products', cacheMiddleware(5 * 60 * 1000), productController.getProducts);
 * 
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 * @param {Function} keyGenerator - Optional function to generate cache key from request
 * @returns {Function} Express middleware
 */
export function cacheMiddleware(
  ttl = 5 * 60 * 1000,
  keyGenerator = (req) => {
    // Default: use method + path + query string as key
    return `cache:${req.method}:${req.path}:${JSON.stringify(req.query)}`;
  }
) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const cached = await getCacheValue(cacheKey);

    if (cached) {
      logger.debug(`Cache HIT: ${cacheKey}`);
      res.setHeader("X-Cache", "HIT");
      res.setHeader("X-Cache-Provider", redisAvailable ? "Redis" : "Memory");
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function (data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCacheValue(cacheKey, data, ttl).catch((err) => {
          logger.error("Failed to cache response:", err);
        });
        logger.debug(`Cache SET: ${cacheKey}`);
        res.setHeader("X-Cache", "MISS");
        res.setHeader("X-Cache-Provider", redisAvailable ? "Redis" : "Memory");
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * Clear cache for a specific pattern
 * Useful for cache invalidation when data changes
 * 
 * @param {string} pattern - Pattern to match cache keys (supports wildcards)
 */
export async function clearCache(pattern = null) {
  if (!pattern) {
    if (redisAvailable && redisClient) {
      try {
        // Clear all cache keys (use with caution in production)
        const keys = await redisClient.keys("cache:*");
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
        logger.info("Redis cache cleared");
      } catch (error) {
        logger.error("Failed to clear Redis cache:", error);
      }
    }
    memoryCache.clear();
    logger.info("Cache cleared");
    return;
  }

  // Simple pattern matching (can be enhanced)
  const regex = new RegExp(pattern.replace("*", ".*"));
  
  if (redisAvailable && redisClient) {
    try {
      const keys = await redisClient.keys("cache:*");
      for (const key of keys) {
        if (regex.test(key)) {
          await redisClient.del(key);
        }
      }
      logger.info(`Redis cache cleared for pattern: ${pattern}`);
    } catch (error) {
      logger.error("Failed to clear Redis cache pattern:", error);
    }
  }
  
  // Also clear memory cache
  for (const key of memoryCache.cache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
  logger.info(`Cache cleared for pattern: ${pattern}`);
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  const stats = {
    provider: redisAvailable ? "Redis" : "Memory",
    available: redisAvailable,
  };

  if (redisAvailable && redisClient) {
    try {
      const info = await redisClient.info("stats");
      const keyspace = await redisClient.info("keyspace");
      stats.redis = {
        info,
        keyspace,
      };
    } catch (error) {
      logger.error("Failed to get Redis stats:", error);
    }
  } else {
    stats.memory = {
      size: memoryCache.cache.size,
    };
  }

  return stats;
}

export { memoryCache, redisClient, redisAvailable };
export default cacheMiddleware;
