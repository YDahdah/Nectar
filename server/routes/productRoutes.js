import express from 'express';
import { getProductList } from '../controllers/productController.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

/**
 * GET /api/products
 * Query: gender (men|women|mix), brand, page, limit
 * Returns: { products: [], total: number }
 * Scalable: plug in DB later; frontend can switch to this when USE_PRODUCTS_API is true.
 * 
 * Cached for 5 minutes to reduce database load
 */
router.get('/', cacheMiddleware(5 * 60 * 1000), getProductList);

export default router;
