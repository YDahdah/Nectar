import express from 'express';
import { createOrder } from '../controllers/orderController.js';
import { validateOrderData } from '../middleware/validation.js';
import { checkoutRateLimiter } from '../middleware/security.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';

const router = express.Router();

// This API is email-only — no database, no order storage.
// The single supported flow is: POST /api/orders/checkout
//   → validate → send email to OWNER_EMAIL / ORDER_EMAIL → return { success: true, orderId }.

// GET /api/orders/checkout — friendly informational response for anyone
// hitting the URL in a browser. Intentionally NOT an error.
router.get('/checkout', (req, res) => {
  res.setHeader('Allow', 'POST');
  return res.status(200).json({
    success: true,
    message: 'Use POST to submit checkout orders',
    method: 'POST',
    endpoint: '/api/orders/checkout',
  });
});

// POST /api/orders/checkout — the only real order endpoint.
router.post(
  '/checkout',
  checkoutRateLimiter,
  idempotencyMiddleware,
  validateOrderData,
  createOrder,
);

// Any other method on /checkout → 405 Method Not Allowed.
router.all('/checkout', (req, res) => {
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({
    success: false,
    error: 'Method Not Allowed. Use POST /api/orders/checkout to submit an order.',
  });
});

// GET /api/orders — informational. No order storage in this project.
router.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message:
      'This API does not store orders. Submit a new order via POST /api/orders/checkout.',
    endpoints: {
      submitOrder: 'POST /api/orders/checkout',
    },
  });
});

export default router;
