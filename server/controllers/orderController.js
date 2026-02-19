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
    // Log incoming request for debugging
    logger.info('Checkout request received', {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      contentType: req.get('content-type'),
      method: req.method,
      url: req.originalUrl,
      itemsCount: req.body?.items?.length || 0,
      firstName: req.body?.firstName,
      lastName: req.body?.lastName,
      phone: req.body?.phone
    });

    const orderData = req.body;
    
    // Validate request body exists
    if (!orderData || typeof orderData !== 'object') {
      logger.error('Invalid request body', { body: req.body });
      throw new ApiError(400, 'Invalid request body. Please check your order data.');
    }
    
    // Validate required fields
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      logger.warn('Order validation failed: no items', { orderData });
      throw new ApiError(400, 'Order must contain at least one item');
    }

    if (!orderData.firstName || !orderData.lastName || !orderData.phone) {
      logger.warn('Order validation failed: missing required fields', {
        hasFirstName: !!orderData.firstName,
        hasLastName: !!orderData.lastName,
        hasPhone: !!orderData.phone
      });
      throw new ApiError(400, 'Missing required fields: firstName, lastName, or phone');
    }
    
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

    // Create order object with all required fields
    const orderObject = {
      orderId,
      firstName: orderData.firstName || '',
      lastName: orderData.lastName || '',
      email: orderData.email || '',
      phone: formattedPhone,
      address: orderData.address || '',
      city: orderData.city || '',
      caza: orderData.caza || '',
      country: orderData.country || 'Lebanon',
      items: orderData.items || [],
      subtotal,
      shippingCost: shippingCost,
      totalPrice: calculatedTotal,
      paymentMethod: orderData.paymentMethod || ORDER_CONFIG.PAYMENT_METHODS.CASH_ON_DELIVERY,
      shippingMethod: orderData.shippingMethod || ORDER_CONFIG.SHIPPING_METHODS.EXPRESS,
      notes: orderData.notes || '',
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || '',
      status: ORDER_CONFIG.STATUS.PENDING,
      notifications: {
        whatsappSent: false,
        emailSent: false,
        customerEmailSent: false,
        ownerNotificationSent: false
      }
    };

    logger.info(`Processing order ${orderId}...`);
    logger.info(`Order total: $${calculatedTotal}, Items: ${orderData.items.length}`);

    // Send notifications (non-blocking) - wrap in try-catch to prevent errors from breaking the response
    let notifications = {
      customerNotification: { success: false },
      ownerNotification: { success: false },
      emailNotification: { success: false },
      customerEmailNotification: { success: false }
    };

    try {
      notifications = await sendNotifications(orderObject, orderId, formattedPhone);
    } catch (notificationError) {
      // Log but don't fail the order if notifications fail
      logger.error('Notification error (non-critical):', notificationError);
    }

    // Return success response
    const responseData = {
      success: true,
      message: 'Order placed successfully. You will receive a confirmation on WhatsApp and email shortly.',
      orderId,
      notifications: {
        whatsapp: notifications.customerNotification.success,
        whatsappMethod: notifications.customerNotification.method || 'console',
        email: notifications.emailNotification.success,
        customerEmail: notifications.customerEmailNotification.success
      }
    };
    
    // Log the response to verify orderId is included
    logger.info(`Order ${orderId} created successfully. Sending response:`, {
      orderId: responseData.orderId,
      hasOrderId: !!responseData.orderId,
      responseKeys: Object.keys(responseData)
    });
    
    res.status(201).json(responseData);

  } catch (error) {
    // Enhanced error logging
    logger.error('Checkout route error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      statusCode: error.statusCode,
      orderData: req.body ? {
        hasItems: !!req.body.items,
        itemsCount: req.body.items?.length,
        hasFirstName: !!req.body.firstName,
        hasLastName: !!req.body.lastName,
        hasPhone: !!req.body.phone,
        hasTotalPrice: typeof req.body.totalPrice !== 'undefined',
        totalPrice: req.body.totalPrice
      } : null
    });

    // If it's already an ApiError, pass it through
    if (error instanceof ApiError) {
      return next(error);
    }

    // For unexpected errors, wrap them
    const apiError = new ApiError(
      error.statusCode || 500,
      error.message || 'An unexpected error occurred while processing your order'
    );
    next(apiError);
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
      logger.info(`✅ Email notification sent successfully to ${results.emailNotification.recipient}`);
      logger.info(`   Message ID: ${results.emailNotification.messageId || 'N/A'}`);
    } else {
      logger.error('❌ Email notification failed:', {
        error: results.emailNotification.error,
        errorCode: results.emailNotification.errorCode,
        recipient: results.emailNotification.recipient
      });
    }
  } catch (error) {
    logger.error('❌ Error sending email notification:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
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
