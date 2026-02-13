import Joi from 'joi';

/**
 * Order item validation schema
 */
const orderItemSchema = Joi.object({
  id: Joi.string().optional(),
  name: Joi.string().required().trim().min(1).max(200),
  size: Joi.string().required().trim().min(1).max(50),
  quantity: Joi.number().integer().min(1).max(100).required(),
  price: Joi.number().positive().precision(2).required()
});

/**
 * Order validation schema
 */
export const orderSchema = Joi.object({
  // Customer Information
  firstName: Joi.string().required().trim().min(1).max(100)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .messages({
      'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes'
    }),
  
  lastName: Joi.string().required().trim().min(1).max(100)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .messages({
      'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes'
    }),
  
  email: Joi.string().required().email().trim().lowercase()
    .max(255)
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  
  phone: Joi.string().required().trim().min(8).max(20)
    .pattern(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  // Shipping Address
  address: Joi.string().required().trim().min(5).max(500),
  city: Joi.string().required().trim().min(1).max(100),
  caza: Joi.string().required().trim().min(1).max(100),
  country: Joi.string().optional().trim().default('Lebanon').max(100),
  
  // Order Items
  items: Joi.array().items(orderItemSchema).min(1).max(50).required()
    .messages({
      'array.min': 'Order must contain at least one item',
      'array.max': 'Order cannot contain more than 50 items'
    }),
  
  // Pricing
  shippingCost: Joi.number().min(0).precision(2).optional().default(0),
  totalPrice: Joi.number().positive().precision(2).required(),
  
  // Payment & Shipping
  paymentMethod: Joi.string().optional().trim().max(100)
    .default('Cash on Delivery'),
  shippingMethod: Joi.string().optional().trim().max(200)
    .default('Express Delivery (2-3 Working Days)'),
  
  // Optional
  notes: Joi.string().optional().trim().max(1000).allow('', null)
}).options({ stripUnknown: true });

/**
 * Validate order data
 */
export function validateOrder(data) {
  const { error, value } = orderSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return {
      isValid: false,
      errors,
      data: null
    };
  }

  // Additional validation: verify total price matches items
  const calculatedSubtotal = value.items.reduce(
    (sum, item) => sum + (item.price * item.quantity), 
    0
  );
  const calculatedTotal = calculatedSubtotal + (value.shippingCost || 0);
  
  // Allow small rounding differences (0.01)
  const priceDifference = Math.abs(calculatedTotal - value.totalPrice);
  if (priceDifference > 0.01) {
    return {
      isValid: false,
      errors: [{
        field: 'totalPrice',
        message: `Total price mismatch. Calculated: $${calculatedTotal.toFixed(2)}, Provided: $${value.totalPrice.toFixed(2)}`
      }],
      data: null
    };
  }

  return {
    isValid: true,
    errors: null,
    data: value
  };
}

/**
 * Test email validation schema
 */
export const testEmailSchema = Joi.object({
  email: Joi.string().required().email().trim().lowercase()
    .max(255)
    .messages({
      'string.email': 'Please provide a valid email address'
    })
});
