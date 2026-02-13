import express from 'express';
import { createOrder, getOrderById, getAllOrders } from '../controllers/orderController.js';
import { validateOrderData } from '../middleware/validation.js';
import { checkoutRateLimiter } from '../middleware/security.js';

const router = express.Router();

// Get all orders (with pagination) - must come before /:orderId
router.get('/', getAllOrders);

// Get order by ID
router.get('/:orderId', getOrderById);

// Checkout endpoint with rate limiting and validation
router.post('/checkout', checkoutRateLimiter, validateOrderData, createOrder);

export default router;
