import {
  sendOwnerOrderNotification,
  sendCustomerConfirmationEmail,
} from '../services/emailService.js';
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

// Log the customer-confirmation outcome without ever affecting the HTTP response.
// Customer confirmation is best-effort: failure here is normal when the Resend
// sandbox sender is used (it only delivers to the Resend account owner), or
// when no domain is verified yet. The order is already considered successful
// once the owner notification path has completed.
function logCustomerEmailOutcome(orderId, outcome) {
  if (!outcome) return;
  if (outcome.__timedOut) {
    logger.warn('Customer confirmation email timed out — owner already notified', {
      orderId,
      timeoutMs: EMAIL_SEND_TIMEOUT_MS,
    });
    return;
  }
  if (outcome.__error) {
    logger.warn('Customer confirmation email threw — owner already notified', {
      orderId,
      message: outcome.__error.message,
      code: outcome.__error.code,
    });
    return;
  }
  if (!outcome.success) {
    logger.warn('Customer confirmation email reported failure', {
      orderId,
      error: outcome.error,
      errorCode: outcome.errorCode,
    });
    return;
  }
  logger.info('Customer confirmation email delivered', {
    orderId,
    recipient: outcome.recipient,
    messageId: outcome.messageId,
  });
}

/**
 * Checkout handler — email only, no persistence.
 *
 * Flow:
 *   1. Receive validated order payload from the frontend (req.body).
 *   2. Generate a one-off orderId and compute total.
 *   3. In parallel, send two emails (each capped at EMAIL_SEND_TIMEOUT_MS):
 *        a. Owner notification — to OWNER_EMAIL / ORDER_EMAIL (resolved inside
 *           emailService). This is the email the operator depends on, so its
 *           outcome drives the `emailDelivered` flag on the response.
 *        b. Customer confirmation — to the buyer's email. Best-effort: its
 *           outcome is only logged and never affects the HTTP response. This
 *           failure is normal until a domain is verified in Resend
 *           (the sandbox sender can't reach arbitrary recipients).
 *   4. Respond with { success: true, orderId, total, emailDelivered }. If the
 *      owner email failed/timed out we still respond success (the customer
 *      must not retry and create duplicates) AND log the full order so the
 *      operator can recover it from logs.
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

    // Fire both emails in parallel. The owner notification governs the response
    // (it's the one the operator depends on). The customer confirmation is
    // best-effort and is never allowed to affect `emailDelivered` or the
    // status code — it just gets logged.
    const [outcome, customerOutcome] = await Promise.all([
      withTimeout(
        sendOwnerOrderNotification(orderForEmail),
        EMAIL_SEND_TIMEOUT_MS,
        'owner-email',
      ),
      withTimeout(
        sendCustomerConfirmationEmail(orderForEmail, orderId),
        EMAIL_SEND_TIMEOUT_MS,
        'customer-email',
      ),
    ]);

    logCustomerEmailOutcome(orderId, customerOutcome);

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
