import { sendOrderNotification } from '../services/messageService.js';
import { sendOrderEmail, sendCustomerConfirmationEmail } from '../services/emailService.js';
import { formatPhoneNumber } from '../utils/phoneFormatter.js';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import { ApiError } from '../middleware/errorHandler.js';
import { generateOrderId, calculateOrderTotal, validateTotalPrice } from '../utils/helpers.js';
import { ERROR_MESSAGES, ORDER_CONFIG } from '../utils/constants.js';

/**
 * Process checkout and create order
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 * 
 * @throws {ApiError} If validation fails or order creation fails
 */
export async function createOrder(req, res, next) {
  try {
    const orderData = req.body;
    
    // Generate order ID
    const orderId = generateOrderId();

    // Format phone number
    const formattedPhone = formatPhoneNumber(orderData.phone);
    if (!formattedPhone) {
      throw new ApiError(400, ERROR_MESSAGES.INVALID_PHONE);
    }

    // Calculate totals
    const subtotal = calculateOrderTotal(orderData.items, 0);
    const shippingCost = Number(orderData.shippingCost) || 0;
    const calculatedTotal = calculateOrderTotal(orderData.items, shippingCost);
    
    // Validate total price matches calculated total
    const providedTotal = Number(orderData.totalPrice) || 0;
    if (!validateTotalPrice(calculatedTotal, providedTotal)) {
      logger.warn(`Order ${orderId}: Total price mismatch. Calculated: ${calculatedTotal}, Provided: ${providedTotal}`);
      throw new ApiError(400, 'Total price mismatch. Please refresh and try again.');
    }

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
      paymentMethod: orderData.paymentMethod || ORDER_CONFIG.PAYMENT_METHODS.CASH_ON_DELIVERY,
      shippingMethod: orderData.shippingMethod || ORDER_CONFIG.SHIPPING_METHODS.EXPRESS,
      notes: orderData.notes,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: ORDER_CONFIG.STATUS.PENDING,
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
 * 
 * @param {Object} orderData - Order data object
 * @param {string} orderId - Order ID
 * @param {string} formattedPhone - Formatted phone number
 * @returns {Promise<Object>} Results of notification attempts
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
