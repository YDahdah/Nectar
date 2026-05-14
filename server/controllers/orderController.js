import { sendOwnerOrderNotification } from '../services/emailService.js';
import logger from '../utils/logger.js';
import { generateOrderId, calculateOrderTotal } from '../utils/helpers.js';

// Hard cap for the email-send step. Must be smaller than the frontend's
// fetch timeout (60s) so the server always replies first.
const EMAIL_SEND_TIMEOUT_MS = 22_000;

function withTimeout(promise, ms, label) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ __timedOut: true, label });
    }, ms);
    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        resolve({ __error: error });
      });
  });
}

/**
 * Checkout handler — email only, no persistence.
 *
 * Flow:
 *   1. Receive validated order payload from the frontend (req.body).
 *   2. Generate a one-off orderId and compute total.
 *   3. Email the order to OWNER_EMAIL / ORDER_EMAIL (resolved inside emailService),
 *      racing against EMAIL_SEND_TIMEOUT_MS so a hung SMTP connection can never
 *      stall the request.
 *   4. Respond with { success: true, orderId, total }. If the email step failed
 *      or timed out, we still respond success (the customer must not retry and
 *      create duplicates) AND we log the full order so the operator can recover
 *      it from logs.
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

    const outcome = await withTimeout(
      sendOwnerOrderNotification(orderForEmail),
      EMAIL_SEND_TIMEOUT_MS,
      'owner-email',
    );

    if (outcome && outcome.__timedOut) {
      logger.error('Owner order email timed out — order accepted but not yet delivered', {
        orderId,
        timeoutMs: EMAIL_SEND_TIMEOUT_MS,
        order: orderForEmail,
      });
      // eslint-disable-next-line no-console
      console.error(
        `[orderController] Owner email TIMED OUT after ${EMAIL_SEND_TIMEOUT_MS}ms — order ${orderId} preserved in logs.`,
      );
      return res.status(201).json({
        success: true,
        message:
          'Order received. Email delivery is taking longer than usual — the shop will contact you shortly.',
        orderId,
        total,
        emailDelivered: false,
      });
    }

    if (outcome && outcome.__error) {
      const emailErr = outcome.__error;
      logger.error('Owner order email threw — order preserved in logs', {
        orderId,
        message: emailErr.message,
        code: emailErr.code,
        response: emailErr.response,
        stack: emailErr.stack,
        order: orderForEmail,
      });
      // eslint-disable-next-line no-console
      console.error('[orderController] Owner email THREW — order preserved in logs:', {
        orderId,
        message: emailErr.message,
        code: emailErr.code,
      });
      return res.status(201).json({
        success: true,
        message:
          'Order received. There was an issue delivering the notification email — the shop will contact you shortly.',
        orderId,
        total,
        emailDelivered: false,
      });
    }

    const result = outcome;
    if (!result || !result.success) {
      logger.warn('Owner order email reported failure — order preserved in logs', {
        orderId,
        error: result?.error,
        errorCode: result?.errorCode,
        order: orderForEmail,
      });
      return res.status(201).json({
        success: true,
        message:
          'Order received. There was an issue delivering the notification email — the shop will contact you shortly.',
        orderId,
        total,
        emailDelivered: false,
      });
    }

    logger.info('Order accepted and owner notified', { orderId, total });
    return res.status(201).json({
      success: true,
      message: 'Order received. The shop owner has been notified by email.',
      orderId,
      total,
      emailDelivered: true,
    });
  } catch (err) {
    next(err);
  }
};
