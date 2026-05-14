import { sendOwnerOrderNotification } from '../services/emailService.js';
import logger from '../utils/logger.js';
import { generateOrderId, calculateOrderTotal } from '../utils/helpers.js';

/**
 * Checkout handler — email only, no persistence.
 *
 * Flow:
 *   1. Receive validated order payload from the frontend (req.body).
 *   2. Generate a one-off orderId and compute total.
 *   3. Email the order to OWNER_EMAIL / ORDER_EMAIL (resolved inside emailService).
 *   4. Respond with { success: true, orderId, total }.
 *
 * No database, MongoDB, Supabase, Redis, or Google Sheets is required or used.
 */
export const createOrder = async (req, res, next) => {
  try {
    const body = req.body || {};
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
      console.error('[orderController] Owner email threw:', {
        message: emailErr.message,
        code: emailErr.code,
        response: emailErr.response,
      });
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

    if (!result || !result.success) {
      logger.warn('Owner order email was not sent', {
        orderId,
        error: result?.error,
        errorCode: result?.errorCode,
      });
      return res.status(502).json({
        success: false,
        message:
          result?.error ||
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
