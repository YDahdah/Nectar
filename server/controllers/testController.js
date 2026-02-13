import { sendCustomerConfirmationEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Test email endpoint
 */
export async function testEmail(req, res, next) {
  try {
    const { email } = req.body;

    const testOrderData = {
      firstName: 'Test',
      lastName: 'Customer',
      email: email,
      phone: '+9611234567',
      address: '123 Test Street',
      city: 'Beirut',
      caza: 'Beirut',
      country: 'Lebanon',
      items: [
        {
          name: 'Test Product',
          size: '100ml',
          quantity: 1,
          price: 50.00
        }
      ],
      shippingCost: 5.00,
      totalPrice: 55.00,
      paymentMethod: 'Cash on Delivery',
      shippingMethod: 'Express Delivery (2-3 Working Days)'
    };

    const testOrderId = `TEST-${Date.now()}`;

    logger.info(`Testing email to: ${email}`);
    const result = await sendCustomerConfirmationEmail(testOrderData, testOrderId);

    if (result.success) {
      res.json({
        success: true,
        message: `Test email sent successfully to ${email}`,
        messageId: result.messageId
      });
    } else {
      throw new ApiError(500, result.error || 'Failed to send test email', false, result.errorCode);
    }
  } catch (error) {
    next(error);
  }
}
