import { sendOrderNotification } from '../services/messageService.js';
import { sendOrderEmail, sendCustomerConfirmationEmail } from '../services/emailService.js';
import { formatPhoneNumber } from '../utils/phoneFormatter.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Process checkout and create order
 */
export async function createOrder(req, res, next) {
  try {
    const orderData = req.body;
    
    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Format phone number
    const formattedPhone = formatPhoneNumber(orderData.phone);
    if (!formattedPhone) {
      throw new ApiError(400, 'Invalid phone number format');
    }

    // Calculate totals
    const subtotal = orderData.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
    const totalPrice = subtotal + (orderData.shippingCost || 0);

    // Create order object
    const orderObject = {
      orderId,
      firstName: orderData.firstName,
      lastName: orderData.lastName,
      email: orderData.email,
      phone: formattedPhone,
      address: orderData.address,
      city: orderData.city,
      caza: orderData.caza,
      country: orderData.country || 'Lebanon',
      items: orderData.items,
      subtotal,
      shippingCost: orderData.shippingCost || 0,
      totalPrice,
      paymentMethod: orderData.paymentMethod || 'Cash on Delivery',
      shippingMethod: orderData.shippingMethod || 'Express Delivery (2-3 Working Days)',
      notes: orderData.notes,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'pending',
      notifications: {
        whatsappSent: false,
        emailSent: false,
        customerEmailSent: false,
        ownerNotificationSent: false
      }
    };

    logger.info(`Processing order ${orderId}...`);
    logger.info(`Sending WhatsApp notification to customer: ${formattedPhone}`);

    // Send notifications (non-blocking)
    const notifications = await sendNotifications(orderData, orderId, formattedPhone);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Order placed successfully. You will receive a confirmation on WhatsApp and email shortly.',
      orderId,
      notifications: {
        whatsapp: notifications.customerNotification.success,
        whatsappMethod: notifications.customerNotification.method || 'console',
        email: notifications.emailNotification.success,
        customerEmail: notifications.customerEmailNotification.success
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Send all notifications for an order
 */
async function sendNotifications(orderData, orderId, formattedPhone) {
  const results = {
    customerNotification: { success: false },
    ownerNotification: { success: false },
    emailNotification: { success: false },
    customerEmailNotification: { success: false }
  };

  try {
    // Send order confirmation to customer via WhatsApp
    results.customerNotification = await sendOrderNotification(
      formattedPhone, 
      orderData, 
      orderId
    );

    if (results.customerNotification.success) {
      logger.info(`Customer notification sent via ${results.customerNotification.method || 'console'}`);
    } else {
      logger.error('Failed to send customer notification:', results.customerNotification.error);
    }
  } catch (error) {
    logger.error('Error sending customer notification:', error);
  }

  try {
    // Send notification to owner
    const ownerPhone = config.ownerPhone;
    if (ownerPhone && ownerPhone !== formattedPhone) {
      logger.info(`Sending order notification to owner: ${ownerPhone}`);
      const ownerOrderData = {
        ...orderData,
        isOwnerNotification: true
      };
      results.ownerNotification = await sendOrderNotification(
        ownerPhone, 
        ownerOrderData, 
        orderId
      );

      if (results.ownerNotification.success) {
        logger.info('Owner notification sent successfully');
      } else {
        logger.warn('Owner notification failed (non-critical)');
      }
    }
  } catch (error) {
    logger.error('Error sending owner notification:', error);
  }

  try {
    // Send email notification to owner
    logger.info('Sending email notification to owner...');
    results.emailNotification = await sendOrderEmail(orderData, orderId);

    if (results.emailNotification.success) {
      logger.info(`Email notification sent to ${results.emailNotification.recipient}`);
    } else {
      logger.warn('Email notification failed (non-critical)');
    }
  } catch (error) {
    logger.error('Error sending email notification:', error);
  }

  try {
    // Send confirmation email to customer
    logger.info('Sending confirmation email to customer...');
    results.customerEmailNotification = await sendCustomerConfirmationEmail(
      orderData, 
      orderId
    );

    if (results.customerEmailNotification.success) {
      logger.info(`Customer confirmation email sent to ${results.customerEmailNotification.recipient}`);
    } else {
      logger.warn('Customer confirmation email failed (non-critical)');
    }
  } catch (error) {
    logger.error('Error sending customer confirmation email:', error);
  }

  return results;
}

/**
 * Get order by ID
 * Note: Database functionality has been removed. This endpoint returns an error.
 */
export async function getOrderById(req, res, next) {
  try {
    throw new ApiError(503, 'Database service unavailable. Order lookup is not supported.');
  } catch (error) {
    next(error);
  }
}

/**
 * Get all orders (with pagination)
 * Note: Database functionality has been removed. This endpoint returns an error.
 */
export async function getAllOrders(req, res, next) {
  try {
    throw new ApiError(503, 'Database service unavailable. Order listing is not supported.');
  } catch (error) {
    next(error);
  }
}
