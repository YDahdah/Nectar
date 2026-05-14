import express from 'express';
import { createOrder, getOrderById, getAllOrders } from '../controllers/orderController.js';
import { validateOrderData } from '../middleware/validation.js';
import { checkoutRateLimiter } from '../middleware/security.js';
import { privateCacheMiddleware } from '../middleware/httpCache.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';

const router = express.Router();

// Checkout endpoint with rate limiting and validation (POST only).
// Defined before /:orderId so GET /checkout cannot fall through to the
// order-lookup handler and produce a misleading "Order lookup is not available" error.
router.post('/checkout', checkoutRateLimiter, idempotencyMiddleware, validateOrderData, createOrder);

// Reject non-POST methods on /checkout with a proper 405 Method Not Allowed.
// This is what a browser hitting the URL directly will see.
router.all('/checkout', (req, res) => {
  res.setHeader('Allow', 'POST');
  return res.status(405).json({
    success: false,
    error: 'Method Not Allowed. Use POST /api/orders/checkout to place an order.',
  });
});

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

export default router;
