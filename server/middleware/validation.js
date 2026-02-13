import { validateOrder, testEmailSchema } from '../validators/orderValidator.js';
import logger from '../utils/logger.js';

/**
 * Validate order data middleware
 */
export function validateOrderData(req, res, next) {
  const validation = validateOrder(req.body);
  
  if (!validation.isValid) {
    logger.warn('Order validation failed:', {
      errors: validation.errors,
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: validation.errors
    });
  }
  
  // Replace req.body with sanitized and validated data
  req.body = validation.data;
  next();
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
