import express from 'express';
import { getProductList } from '../controllers/productController.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { httpCacheMiddleware } from '../middleware/httpCache.js';

const router = express.Router();

/**
 * GET /api/products
 * Query: gender (men|women|mix), brand, page, limit
 * Returns: { products: [], total: number }
 * Scalable: plug in DB later; frontend can switch to this when USE_PRODUCTS_API is true.
 * 
 * Cached for 5 minutes to reduce database load
 * Uses both application-level caching and HTTP cache headers for optimal performance
 */
router.get('/', 
  httpCacheMiddleware({ maxAge: 300, etag: true }), // HTTP cache headers (5 min)
  cacheMiddleware(5 * 60 * 1000), // Application-level cache (5 min)
  getProductList
);

export default router;
