import logger from "../utils/logger.js";

/**
 * Simple in-memory cache middleware
 * For production, replace with Redis for distributed caching
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
 * Cache middleware for Express routes
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
    return `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
  }
) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const cached = memoryCache.get(cacheKey);

    if (cached) {
      logger.debug(`Cache HIT: ${cacheKey}`);
      res.setHeader("X-Cache", "HIT");
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function (data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        memoryCache.set(cacheKey, data, ttl);
        logger.debug(`Cache SET: ${cacheKey}`);
        res.setHeader("X-Cache", "MISS");
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
export function clearCache(pattern = null) {
  if (!pattern) {
    memoryCache.clear();
    logger.info("Cache cleared");
    return;
  }

  // Simple pattern matching (can be enhanced)
  const regex = new RegExp(pattern.replace("*", ".*"));
  for (const key of memoryCache.cache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
  logger.info(`Cache cleared for pattern: ${pattern}`);
}

/**
 * Redis cache middleware (for production)
 * Uncomment and configure when Redis is available
 * 
 * Example:
 *   import redis from 'redis';
 *   const redisClient = redis.createClient({ url: process.env.REDIS_URL });
 *   await redisClient.connect();
 * 
 * Then replace memoryCache with Redis client
 */
/*
import redis from 'redis';

let redisClient = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    await redisClient.connect();
  }
  return redisClient;
}

export async function redisCacheMiddleware(ttl = 5 * 60 * 1000) {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `cache:${req.method}:${req.path}:${JSON.stringify(req.query)}`;
    const client = await getRedisClient();

    try {
      const cached = await client.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }

      const originalJson = res.json.bind(res);
      res.json = function(data) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          client.setEx(cacheKey, Math.floor(ttl / 1000), JSON.stringify(data));
          res.setHeader('X-Cache', 'MISS');
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Redis cache error:', error);
      next(); // Continue without caching on error
    }
  };
}
*/

export { memoryCache };
export default cacheMiddleware;
