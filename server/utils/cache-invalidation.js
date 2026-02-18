/**
 * Cache Invalidation Utilities
 * Provides helpers for automatically invalidating cache when data changes
 */

import { clearCache } from './cache.js';
import logger from './logger.js';

/**
 * Invalidate product-related cache
 * Call this after creating, updating, or deleting products
 */
export async function invalidateProductCache(productId = null) {
  const patterns = [
    'cache:GET:/api/products:*', // All product listings
  ];

  if (productId) {
    patterns.push(`cache:GET:/api/products/${productId}:*`); // Specific product
  }

  for (const pattern of patterns) {
    await clearCache(pattern);
  }

  logger.info(`Product cache invalidated${productId ? ` for product ${productId}` : ''}`);
}

/**
 * Invalidate order-related cache
 * Call this after creating or updating orders
 */
export async function invalidateOrderCache(orderId = null, userId = null) {
  const patterns = [
    'cache:GET:/api/orders:*', // All order listings
  ];

  if (orderId) {
    patterns.push(`cache:GET:/api/orders/${orderId}:*`); // Specific order
  }

  if (userId) {
    patterns.push(`cache:GET:/api/orders:*userId*${userId}*`); // User's orders
  }

  for (const pattern of patterns) {
    await clearCache(pattern);
  }

  logger.info(`Order cache invalidated${orderId ? ` for order ${orderId}` : ''}`);
}

/**
 * Invalidate newsletter cache
 */
export async function invalidateNewsletterCache() {
  await clearCache('cache:GET:/api/newsletter:*');
  logger.info('Newsletter cache invalidated');
}

/**
 * Invalidate all cache (use with caution)
 */
export async function invalidateAllCache() {
  await clearCache();
  logger.warn('All cache invalidated');
}

/**
 * Middleware to automatically invalidate cache after mutations
 * Usage: router.post('/products', invalidateCacheOnSuccess('product'), createProduct);
 */
export function invalidateCacheOnSuccess(type) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidate cache asynchronously (don't block response)
        setImmediate(async () => {
          try {
            switch (type) {
              case 'product':
                await invalidateProductCache(req.body?.id || req.params?.id);
                break;
              case 'order':
                await invalidateOrderCache(
                  req.body?.orderId || req.params?.orderId,
                  req.body?.userId || req.user?.id
                );
                break;
              case 'newsletter':
                await invalidateNewsletterCache();
                break;
              default:
                logger.warn(`Unknown cache invalidation type: ${type}`);
            }
          } catch (error) {
            logger.error('Cache invalidation error:', error);
          }
        });
      }
      return originalJson(data);
    };
    
    next();
  };
}
