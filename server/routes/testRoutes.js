import express from 'express';
import { sendOrderEmail, sendCustomerConfirmationEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /test/checkout-emails
 * Test both owner and customer emails as they would be sent during checkout
 */
router.post('/checkout-emails', async (req, res) => {
  try {
    const { customerEmail } = req.body;
    
    if (!customerEmail) {
      return res.status(400).json({
        success: false,
        error: 'customerEmail is required in request body'
      });
    }

    const testOrderData = {
      firstName: 'Test',
      lastName: 'Customer',
      email: customerEmail,
      phone: '+9613123456',
      address: '123 Test Street',
      city: 'Beirut',
      caza: 'Beirut',
      country: 'Lebanon',
      items: [
        {
          name: 'Test Product',
          price: 50.00,
          quantity: 1,
          size: '100ml'
        }
      ],
      shippingCost: 3.00,
      totalPrice: 53.00,
      paymentMethod: 'Cash on Delivery',
      shippingMethod: 'Express Delivery (2-3 Working Days)'
    };

    const testOrderId = `TEST-CHECKOUT-${Date.now()}`;

    logger.info('🧪 Testing checkout email flow...');
    logger.info(`   Customer email: ${customerEmail}`);
    logger.info(`   Test order ID: ${testOrderId}`);

    // Test owner email (sendOrderEmail)
    logger.info('\n📧 Testing owner notification email...');
    const ownerEmailResult = await sendOrderEmail(testOrderData, testOrderId);
    
    // Test customer email (sendCustomerConfirmationEmail)
    logger.info('\n📧 Testing customer confirmation email...');
    const customerEmailResult = await sendCustomerConfirmationEmail(testOrderData, testOrderId);

    const results = {
      success: true,
      orderId: testOrderId,
      ownerEmail: {
        success: ownerEmailResult.success,
        messageId: ownerEmailResult.messageId,
        recipient: ownerEmailResult.recipient,
        error: ownerEmailResult.error || null
      },
      customerEmail: {
        success: customerEmailResult.success,
        messageId: customerEmailResult.messageId,
        recipient: customerEmailResult.recipient,
        error: customerEmailResult.error || null
      }
    };

    logger.info('\n✅ Test results:', results);

    res.status(200).json(results);
  } catch (error) {
    logger.error('❌ Test checkout emails error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
