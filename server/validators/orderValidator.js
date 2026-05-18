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
  
  email: Joi.string().optional().allow('').email().trim().lowercase()
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
    .default('Delivery (2-4 days)'),
  
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

  // Additional validation: verify total price matches items (round to avoid float drift).
  // Customer-facing rule (mirrored from your-dream-website/src/contexts/CartContext.tsx):
  // when the cart holds more than one item the perfume subtotal is ceilinged to the
  // next whole dollar so the displayed price has no decimals. Shipping is added on top
  // and is not affected by the ceiling. We accept either the exact sum or the
  // ceiling-rounded sum so both the cart UI and any older clients keep working.
  const rawSubtotal = value.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const exactSubtotal = Math.round(rawSubtotal * 100) / 100;
  const totalQuantity = value.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const ceilingSubtotal = totalQuantity > 1 ? Math.ceil(rawSubtotal) : exactSubtotal;
  const shipping = Number(value.shippingCost) || 0;
  const exactTotal = Math.round((exactSubtotal + shipping) * 100) / 100;
  const ceilingTotal = Math.round((ceilingSubtotal + shipping) * 100) / 100;
  const providedTotal = Math.round(Number(value.totalPrice) * 100) / 100;

  const matchesExact = Math.abs(exactTotal - providedTotal) <= 0.01;
  const matchesCeiling = Math.abs(ceilingTotal - providedTotal) <= 0.01;
  if (!matchesExact && !matchesCeiling) {
    return {
      isValid: false,
      errors: [{
        field: 'totalPrice',
        message: `Total price mismatch. Calculated: $${exactTotal.toFixed(2)}, Provided: $${providedTotal.toFixed(2)}`
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
