import express from 'express';
import { createOrder, getOrderById, getAllOrders } from '../controllers/orderController.js';
import { validateOrderData } from '../middleware/validation.js';
import { checkoutRateLimiter } from '../middleware/security.js';
import { privateCacheMiddleware } from '../middleware/httpCache.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// Get all orders (with pagination) - must come before /:orderId
// Private cache for user-specific data (short TTL)
router.get('/', 
  privateCacheMiddleware(60), // 1 minute private cache
  cacheMiddleware(60 * 1000), // 1 minute application cache
  getAllOrders
);

// Get order by ID
// Private cache for user-specific data (short TTL)
router.get('/:orderId', 
  privateCacheMiddleware(60), // 1 minute private cache
  cacheMiddleware(60 * 1000), // 1 minute application cache
  getOrderById
);

// Checkout endpoint with rate limiting and validation
router.post('/checkout', checkoutRateLimiter, validateOrderData, createOrder);

export default router;
