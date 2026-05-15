import {
  sendOwnerOrderNotification,
  sendCustomerConfirmationEmail,
} from '../services/emailService.js';
import logger from '../utils/logger.js';
import { generateOrderId, calculateOrderTotal } from '../utils/helpers.js';

/**
 * Fires both order emails in the background, AFTER the HTTP response has been
 * sent. Both send functions are guaranteed not to throw (they always resolve
 * to `{ success, ... }`), but we still wrap with .catch() so that even an
 * unexpected synchronous throw can never bubble up to the Node event loop and
 * crash the process — which is what was causing Render to restart the worker
 * mid-request and turn a ~10s checkout into a hard outage.
 */
function fireOrderEmailsInBackground(orderForEmail, orderId) {
  setImmediate(() => {
    Promise.resolve()
      .then(async () => {
        const ownerResult = await sendOwnerOrderNotification(orderForEmail).catch((err) => ({
          success: false,
          error: err?.message || 'sendOwnerOrderNotification threw',
        }));

        if (ownerResult?.success) {
          logger.info('[background] Owner email delivered', {
            orderId,
            id: ownerResult.id,
            recipient: ownerResult.recipient,
          });
          // eslint-disable-next-line no-console
          console.log('[background] Owner email delivered for', orderId, '→', ownerResult.id);
        } else {
          logger.warn('[background] Owner email failed', {
            orderId,
            error: ownerResult?.error,
          });
          // eslint-disable-next-line no-console
          console.log('[background] Owner email failed for', orderId, '→', ownerResult?.error);
        }

        const customerResult = await sendCustomerConfirmationEmail(orderForEmail, orderId).catch(
          (err) => ({
            success: false,
            error: err?.message || 'sendCustomerConfirmationEmail threw',
          }),
        );

        if (customerResult?.success) {
          logger.info('[background] Customer email delivered', {
            orderId,
            id: customerResult.id,
            recipient: customerResult.recipient,
          });
          // eslint-disable-next-line no-console
          console.log('[background] Customer email delivered for', orderId, '→', customerResult.id);
        } else {
          logger.warn('[background] Customer email failed', {
            orderId,
            error: customerResult?.error,
          });
          // eslint-disable-next-line no-console
          console.log('[background] Customer email failed for', orderId, '→', customerResult?.error);
        }
      })
      .catch((err) => {
        // Defensive: should never get here because both senders are wrapped
        // with .catch() above. Log and swallow so the process stays alive.
        logger.error('[background] Unexpected exception in email pipeline', {
          orderId,
          message: err?.message,
          stack: err?.stack,
        });
        // eslint-disable-next-line no-console
        console.log('[background] Unexpected exception:', err?.message);
      });
  });
}

/**
 * Checkout handler — accepts the order, responds 201 immediately, then fires
 * both notification emails in the background.
 *
 * Why the response can't await emails:
 *   On Render's free tier, awaiting email sends inside the request handler
 *   was making POST /api/orders/checkout take ~10s, and any rare email-pipeline
 *   exception was crashing the worker so Render would restart it mid-request.
 *   By replying first and using `setImmediate`, the HTTP response is always
 *   fast and email failures only ever show up in logs.
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

    logger.info('Order accepted (responding before sending emails)', { orderId, total });

    res.status(201).json({
      success: true,
      message: 'Order received. The shop will follow up via WhatsApp and email shortly.',
      orderId,
      total,
      emailDelivered: 'pending',
    });

    fireOrderEmailsInBackground(orderForEmail, orderId);
  } catch (err) {
    next(err);
  }
};
