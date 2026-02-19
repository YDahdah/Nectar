import { validateOrder, testEmailSchema } from '../validators/orderValidator.js';
import logger from '../utils/logger.js';

/**
 * Validate order data middleware
 */
export function validateOrderData(req, res, next) {
  try {
    // Log incoming data for debugging
    logger.info('Validating order data:', {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      hasItems: !!req.body?.items,
      itemsCount: req.body?.items?.length || 0,
      hasFirstName: !!req.body?.firstName,
      hasLastName: !!req.body?.lastName,
      hasPhone: !!req.body?.phone
    });

    const validation = validateOrder(req.body);
    
    if (!validation.isValid) {
      logger.warn('Order validation failed:', {
        errors: validation.errors,
        ip: req.ip,
        body: req.body
      });
      const firstMessage = validation.errors?.[0]?.message || 'Validation failed';
      return res.status(400).json({
        success: false,
        error: firstMessage,
        errors: validation.errors
      });
    }
    
    // Replace req.body with sanitized and validated data
    req.body = validation.data;
    next();
  } catch (error) {
    logger.error('Validation middleware error:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    return res.status(500).json({
      success: false,
      error: 'Validation error: ' + error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
}

/**
 * Validate test email data middleware
 */
export function validateTestEmailData(req, res, next) {
  const { error, value } = testEmailSchema.validate(req.body);
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    logger.warn('Test email validation failed:', {
      errors,
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors
    });
  }
  
  req.body = value;
  next();
}
