import { sendOwnerOrderNotification } from '../services/emailService.js';
import logger from '../utils/logger.js';
import { ApiError } from '../middleware/errorHandler.js';
import { generateOrderId, calculateOrderTotal } from '../utils/helpers.js';

/**
 * Checkout: notify owner by email only (no database).
 * Each request is independent—many users can check out at once without shared DB contention.
 */
export const createOrder = async (req, res, next) => {
  try {
    const body = req.body;
    const orderId = generateOrderId();
    const shippingCost = Number(body.shippingCost) || 0;
    const total = calculateOrderTotal(body.items, shippingCost);

    const orderForEmail = {
      ...body,
      orderId,
      totalPrice: total,
    };

    let result;
    try {
      result = await sendOwnerOrderNotification(orderForEmail);
    } catch (emailErr) {
      // eslint-disable-next-line no-console
      console.error('[orderController] ❌ Owner email FAILED:');
      // eslint-disable-next-line no-console
      console.error('  Message:', emailErr.message);
      // eslint-disable-next-line no-console
      console.error('  Code:', emailErr.code);
      // eslint-disable-next-line no-console
      console.error('  Response:', emailErr.response);
      // eslint-disable-next-line no-console
      console.error('  Stack:', emailErr.stack);
      logger.error('Owner order email threw', {
        orderId,
        message: emailErr.message,
        code: emailErr.code,
        response: emailErr.response,
        stack: emailErr.stack,
      });
      return res.status(502).json({
        success: false,
        message:
          emailErr.message ||
          'We could not send your order notification. Please try again in a moment or contact us by phone.',
        orderId,
      });
    }

    if (!result.success) {
      // eslint-disable-next-line no-console
      console.error(
        '[orderController] Owner email failed:',
        result.error,
        result.errorCode || '',
      );
      logger.warn('Owner order email was not sent', {
        orderId,
        error: result.error,
        errorCode: result.errorCode,
      });
      return res.status(502).json({
        success: false,
        message:
          result.error ||
          'We could not send your order notification. Please try again in a moment or contact us by phone.',
        orderId,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Order received. The shop owner has been notified by email.',
      orderId,
      total,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get order by ID
 * Note: No order persistence — lookup is not available without a database.
 */
export async function getOrderById(req, res, next) {
  try {
    throw new ApiError(503, 'Order lookup is not available without order storage.');
  } catch (error) {
    next(error);
  }
}

/**
 * Get all orders (with pagination)
 * Note: No order persistence — listing is not available without a database.
 */
export async function getAllOrders(req, res, next) {
  try {
    throw new ApiError(503, 'Order listing is not available without order storage.');
  } catch (error) {
    next(error);
  }
}
