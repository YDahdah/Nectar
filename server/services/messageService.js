import logger from '../utils/logger.js';

/**
 * Formats order data into a readable message with ALL details
 */
function formatOrderMessage(orderData, orderId = null) {
  const { 
    firstName, 
    lastName, 
    address, 
    city, 
    caza, 
    phone, 
    country, 
    items, 
    shippingCost, 
    totalPrice, 
    paymentMethod, 
    shippingMethod 
  } = orderData;

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Format timestamp
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  // Different message format for customer vs owner
  const isOwnerNotification = orderData.isOwnerNotification;
  let message = '';
  
  if (isOwnerNotification) {
    // Message for owner - "NEW ORDER RECEIVED"
    message = `🛍️ *NEW ORDER RECEIVED*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Order Information
    if (orderId) {
      message += `📋 *Order ID:* ${orderId}\n`;
    }
    message += `📅 *Date & Time:* ${timestamp}\n`;
    message += `\n`;

    // Customer Information
    message += `👤 *CUSTOMER INFORMATION*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `Name: ${firstName} ${lastName}\n`;
    message += `Phone: ${phone}\n`;
    message += `Address: ${address}\n`;
    message += `City: ${city}\n`;
    message += `Caza: ${caza}\n`;
    message += `Country: ${country || 'Lebanon'}\n`;
    message += `\n`;
  } else {
    // Message for customer - "ORDER CONFIRMATION"
    message = `✅ *ORDER CONFIRMATION*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `Thank you for your order, ${firstName}!\n\n`;
    
    // Order Information
    if (orderId) {
      message += `📋 *Your Order ID:* ${orderId}\n`;
    }
    message += `📅 *Order Date:* ${timestamp}\n`;
    message += `\n`;

    // Delivery Information
    message += `📍 *DELIVERY ADDRESS*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `${firstName} ${lastName}\n`;
    message += `${address}\n`;
    message += `${city}, ${caza}\n`;
    message += `${country || 'Lebanon'}\n`;
    message += `Phone: ${phone}\n`;
    message += `\n`;
  }

  // Order Items - Detailed
  message += `📦 *ORDER ITEMS* (${totalItems} item${totalItems !== 1 ? 's' : ''})\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    message += `${index + 1}. *${item.name}*\n`;
    message += `   Size: ${item.size}\n`;
    message += `   Quantity: ${item.quantity}\n`;
    message += `   Unit Price: $${item.price.toFixed(2)}\n`;
    message += `   Subtotal: $${itemTotal.toFixed(2)}\n`;
    if (item.id) {
      message += `   Product ID: ${item.id}\n`;
    }
    message += `\n`;
  });

  // Order Summary
  message += `💰 *ORDER SUMMARY*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Subtotal: $${subtotal.toFixed(2)}\n`;
  if (shippingCost && shippingCost > 0) {
    message += `Shipping Cost: $${shippingCost.toFixed(2)}\n`;
  }
  message += `*TOTAL: $${totalPrice.toFixed(2)}*\n`;
  message += `\n`;

  // Shipping & Payment
  message += `🚚 *SHIPPING DETAILS*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Method: ${shippingMethod || 'Express Delivery (2-3 Working Days)'}\n`;
  message += `\n`;

  message += `💳 *PAYMENT DETAILS*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Method: ${paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : paymentMethod}\n`;
  message += `\n`;

  if (isOwnerNotification) {
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `Action Required: Process this order 📦\n`;
  } else {
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `We'll contact you soon to confirm your order! 🙏\n`;
    message += `If you have any questions, please contact us.\n`;
  }

  return message;
}

/**
 * Main function to send order notification
 * Logs order notification to console
 */
export async function sendOrderNotification(phoneNumber, orderData, orderId = null) {
  const message = formatOrderMessage(orderData, orderId);

  // Log to console
  logger.info('\n' + '='.repeat(50));
  logger.info('📱 ORDER NOTIFICATION (Console Log)');
  logger.info('='.repeat(50));
  logger.info(`To: ${phoneNumber}`);
  logger.info(`Time: ${new Date().toLocaleString()}`);
  logger.info('-'.repeat(50));
  logger.info(message);
  logger.info('='.repeat(50) + '\n');

  return {
    success: true,
    method: 'console',
    message: 'Order logged to console'
  };
}
