import nodemailer from 'nodemailer';
import config from '../config/config.js';
import logger from '../utils/logger.js';

// Create transporter - using Gmail SMTP
let transporter = null;

const PLACEHOLDER_EMAIL = 'your-email@gmail.com';

function isPlaceholderEmail(user) {
  if (!user || typeof user !== 'string') return true;
  const u = user.trim().toLowerCase();
  return u === '' || u === PLACEHOLDER_EMAIL || u.includes('your-email') || u.includes('example.com');
}

function initializeTransporter() {
  if (transporter) return transporter;

  const emailUser = config.email.user;
  const emailPassword = config.email.password;

  logger.info(`📧 Email configuration check:`);
  logger.info(`   EMAIL_USER: ${emailUser ? 'Set' : 'Not set'}`);
  logger.info(`   EMAIL_PASSWORD: ${emailPassword ? 'Set' : 'Not set'}`);

  if (!emailPassword || !emailUser) {
    logger.warn('⚠️ EMAIL_PASSWORD or EMAIL_USER not set. Email functionality will be disabled.');
    logger.warn('   Please set EMAIL_USER and EMAIL_PASSWORD in your .env file');
    logger.warn('   For Gmail, use an App Password (see server/EMAIL_SETUP.md)');
    return null;
  }

  if (isPlaceholderEmail(emailUser)) {
    logger.warn('⚠️ EMAIL_USER is still the placeholder (your-email@gmail.com). Emails disabled.');
    logger.warn('   In server/.env set EMAIL_USER=your-real@gmail.com and EMAIL_PASSWORD=<Gmail App Password>');
    logger.warn('   Steps: Google Account → Security → 2-Step Verification → App passwords → Generate');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword
    }
  });

  // Verify transporter connection (async; don't block)
  transporter.verify(function (error) {
    if (error) {
      if (error.code === 'EAUTH') {
        logger.warn('⚠️ Gmail login failed. In server/.env set EMAIL_PASSWORD to a Gmail App Password (not your normal password). Create one: https://myaccount.google.com/apppasswords');
      } else {
        logger.error('❌ Email transporter verification failed:', error.message);
      }
    } else {
      logger.info('✅ Email transporter verified successfully');
    }
  });

  return transporter;
}

/**
 * Formats order data into HTML email format
 */
function formatOrderEmailHTML(orderData, orderId = null) {
  const {
    firstName,
    lastName,
    address,
    city,
    caza,
    phone,
    email,
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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #000;
          color: #fff;
          padding: 20px;
          text-align: center;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border: 1px solid #ddd;
        }
        .section {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #fff;
          border-left: 4px solid #000;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #000;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .total {
          font-size: 20px;
          font-weight: bold;
          color: #000;
          margin-top: 10px;
        }
        .footer {
          margin-top: 20px;
          padding: 15px;
          background-color: #f5f5f5;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🛍️ NEW ORDER RECEIVED</h1>
      </div>
      
      <div class="content">
        <div class="section">
          <div class="section-title">📋 Order Information</div>
          <p><strong>Order ID:</strong> ${orderId || 'N/A'}</p>
          <p><strong>Date & Time:</strong> ${timestamp}</p>
        </div>

        <div class="section">
          <div class="section-title">👤 Customer Information</div>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email || 'N/A'}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Address:</strong> ${address}</p>
          <p><strong>City:</strong> ${city}</p>
          <p><strong>Caza:</strong> ${caza}</p>
          <p><strong>Country:</strong> ${country || 'Lebanon'}</p>
        </div>

        <div class="section">
          <div class="section-title">📦 Order Items (${totalItems} item${totalItems !== 1 ? 's' : ''})</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Size</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, index) => {
                const itemTotal = item.price * item.quantity;
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.size}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>$${itemTotal.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">💰 Order Summary</div>
          <p>Subtotal: $${subtotal.toFixed(2)}</p>
          ${shippingCost && shippingCost > 0 ? `<p>Shipping Cost: $${shippingCost.toFixed(2)}</p>` : ''}
          <p class="total">TOTAL: $${totalPrice.toFixed(2)}</p>
        </div>
      </div>

      <div class="footer">
        <p>Action Required: Process this order 📦</p>
        <p>This is an automated email from Nectar Perfume Shop</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Formats order data into plain text email format
 */
function formatOrderEmailText(orderData, orderId = null) {
  const {
    firstName,
    lastName,
    address,
    city,
    caza,
    phone,
    email,
    country,
    items,
    shippingCost,
    totalPrice,
    paymentMethod,
    shippingMethod
  } = orderData;

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  let text = `🛍️ NEW ORDER RECEIVED\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `📋 Order ID: ${orderId || 'N/A'}\n`;
  text += `📅 Date & Time: ${timestamp}\n\n`;
  
  text += `👤 CUSTOMER INFORMATION\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Name: ${firstName} ${lastName}\n`;
  text += `Email: ${email || 'N/A'}\n`;
  text += `Phone: ${phone}\n`;
  text += `Address: ${address}\n`;
  text += `City: ${city}\n`;
  text += `Caza: ${caza}\n`;
  text += `Country: ${country || 'Lebanon'}\n\n`;

  text += `📦 ORDER ITEMS (${totalItems} item${totalItems !== 1 ? 's' : ''})\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    text += `${index + 1}. ${item.name}\n`;
    text += `   Size: ${item.size}\n`;
    text += `   Quantity: ${item.quantity}\n`;
    text += `   Unit Price: $${item.price.toFixed(2)}\n`;
    text += `   Subtotal: $${itemTotal.toFixed(2)}\n\n`;
  });

  text += `💰 ORDER SUMMARY\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Subtotal: $${subtotal.toFixed(2)}\n`;
  if (shippingCost && shippingCost > 0) {
    text += `Shipping Cost: $${shippingCost.toFixed(2)}\n`;
  }
  text += `TOTAL: $${totalPrice.toFixed(2)}\n\n`;

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Action Required: Process this order 📦\n`;

  return text;
}

/**
 * Formats customer confirmation email into HTML format
 */
function formatCustomerConfirmationEmailHTML(orderData, orderId = null) {
  const {
    firstName,
    lastName,
    address,
    city,
    caza,
    phone,
    email,
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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #000;
          color: #fff;
          padding: 30px 20px;
          text-align: center;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px 20px;
          border: 1px solid #ddd;
        }
        .greeting {
          font-size: 20px;
          margin-bottom: 20px;
          color: #000;
        }
        .success-message {
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          text-align: center;
          font-weight: bold;
        }
        .section {
          margin-bottom: 20px;
          padding: 15px;
          background-color: #fff;
          border-left: 4px solid #000;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #000;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .total {
          font-size: 20px;
          font-weight: bold;
          color: #000;
          margin-top: 10px;
        }
        .info-box {
          background-color: #e7f3ff;
          border-left: 4px solid #0066cc;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 20px;
          padding: 15px;
          background-color: #f5f5f5;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✨ Order Confirmation</h1>
      </div>
      
      <div class="content">
        <div class="greeting">
          Hello ${firstName} ${lastName},
        </div>

        <div class="success-message">
          ✅ Thank you for your order! We've successfully received it.
        </div>

        <div class="section">
          <div class="section-title">📋 Order Details</div>
          <p><strong>Order ID:</strong> ${orderId || 'N/A'}</p>
          <p><strong>Order Date:</strong> ${timestamp}</p>
          <p><strong>Shipping Method:</strong> ${shippingMethod || 'Express Delivery (2-3 Working Days)'}</p>
          ${paymentMethod ? `<p><strong>Payment Method:</strong> ${paymentMethod}</p>` : ''}
        </div>

        <div class="section">
          <div class="section-title">📦 Order Items (${totalItems} item${totalItems !== 1 ? 's' : ''})</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Size</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, index) => {
                const itemTotal = item.price * item.quantity;
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.size}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>$${itemTotal.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">💰 Order Summary</div>
          <p>Subtotal: $${subtotal.toFixed(2)}</p>
          ${shippingCost && shippingCost > 0 ? `<p>Shipping Cost: $${shippingCost.toFixed(2)}</p>` : ''}
          <p class="total">TOTAL: $${totalPrice.toFixed(2)}</p>
        </div>

        <div class="section">
          <div class="section-title">📍 Delivery Address</div>
          <p>${address}</p>
          <p>${city}, ${caza}</p>
          <p>${country || 'Lebanon'}</p>
          <p><strong>Phone:</strong> ${phone}</p>
        </div>

        <div class="info-box">
          <strong>📬 What's Next?</strong><br>
          We're processing your order and will contact you soon via WhatsApp to confirm the details. 
          Your order will be delivered within 2-3 working days.
        </div>
      </div>

      <div class="footer">
        <p>Thank you for shopping with Nectar Perfume Shop! 🛍️</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>This is an automated confirmation email. Please save this email for your records.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Formats customer confirmation email into plain text format
 */
function formatCustomerConfirmationEmailText(orderData, orderId = null) {
  const {
    firstName,
    lastName,
    address,
    city,
    caza,
    phone,
    email,
    country,
    items,
    shippingCost,
    totalPrice,
    paymentMethod,
    shippingMethod
  } = orderData;

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  let text = `✨ ORDER CONFIRMATION\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `Hello ${firstName} ${lastName},\n\n`;
  text += `✅ Thank you for your order! We've successfully received it.\n\n`;
  
  text += `📋 ORDER DETAILS\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Order ID: ${orderId || 'N/A'}\n`;
  text += `Order Date: ${timestamp}\n`;
  text += `Shipping Method: ${shippingMethod || 'Express Delivery (2-3 Working Days)'}\n`;
  if (paymentMethod) {
    text += `Payment Method: ${paymentMethod}\n`;
  }
  text += `\n`;

  text += `📦 ORDER ITEMS (${totalItems} item${totalItems !== 1 ? 's' : ''})\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    text += `${index + 1}. ${item.name}\n`;
    text += `   Size: ${item.size}\n`;
    text += `   Quantity: ${item.quantity}\n`;
    text += `   Unit Price: $${item.price.toFixed(2)}\n`;
    text += `   Subtotal: $${itemTotal.toFixed(2)}\n\n`;
  });

  text += `💰 ORDER SUMMARY\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Subtotal: $${subtotal.toFixed(2)}\n`;
  if (shippingCost && shippingCost > 0) {
    text += `Shipping Cost: $${shippingCost.toFixed(2)}\n`;
  }
  text += `TOTAL: $${totalPrice.toFixed(2)}\n\n`;

  text += `📍 DELIVERY ADDRESS\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `${address}\n`;
  text += `${city}, ${caza}\n`;
  text += `${country || 'Lebanon'}\n`;
  text += `Phone: ${phone}\n\n`;

  text += `📬 WHAT'S NEXT?\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `We're processing your order and will contact you soon via WhatsApp to confirm the details. `;
  text += `Your order will be delivered within 2-3 working days.\n\n`;

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Thank you for shopping with Nectar Perfume Shop! 🛍️\n`;
  text += `If you have any questions, please don't hesitate to contact us.\n`;
  text += `This is an automated confirmation email. Please save this email for your records.\n`;

  return text;
}

/**
 * Sends order confirmation email to customer
 */
export async function sendCustomerConfirmationEmail(orderData, orderId = null) {
  const emailTransporter = initializeTransporter();
  
  if (!emailTransporter) {
    logger.warn('⚠️ Email transporter not initialized. Customer confirmation email will not be sent.');
    return {
      success: false,
      error: 'Email transporter not configured',
      method: 'email'
    };
  }

  // Get customer's email and name from order data
  let customerEmail = orderData.email;
  const customerName = `${orderData.firstName} ${orderData.lastName}`;
  
  if (!customerEmail) {
    logger.warn('⚠️ Customer email not provided. Skipping customer confirmation email.');
    return {
      success: false,
      error: 'Customer email not provided',
      method: 'email'
    };
  }

  // Clean and validate email address
  customerEmail = customerEmail.trim().toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customerEmail)) {
    logger.error(`❌ Invalid email address format: ${customerEmail}`);
    return {
      success: false,
      error: `Invalid email address format: ${customerEmail}`,
      method: 'email'
    };
  }

  logger.info(`📧 Preparing to send confirmation email to customer: ${customerEmail}`);

  const emailUser = config.email.user;
  const shopName = config.email.shopName;

  const mailOptions = {
    from: `"${shopName}" <${emailUser}>`,
    replyTo: emailUser,
    to: customerEmail,
    subject: `✨ Order Confirmation - ${orderId || 'Your Order'}`,
    text: formatCustomerConfirmationEmailText(orderData, orderId),
    html: formatCustomerConfirmationEmailHTML(orderData, orderId),
    headers: {
      'X-Customer-Name': customerName,
      'X-Order-ID': orderId || 'N/A',
      'List-Unsubscribe': `<mailto:${emailUser}?subject=Unsubscribe>`
    }
  };

  try {
    logger.info(`📧 Attempting to send email:`);
    logger.info(`   From: ${emailUser}`);
    logger.info(`   To: ${customerEmail}`);
    logger.info(`   Subject: ${mailOptions.subject}`);
    logger.info(`   Email transporter initialized: ${emailTransporter ? 'Yes' : 'No'}`);
    
    // Verify transporter before sending
    if (!emailTransporter) {
      throw new Error('Email transporter is not initialized');
    }
    
    const info = await emailTransporter.sendMail(mailOptions);
    
    logger.info(`✅ Customer confirmation email sent successfully to ${customerEmail}`);
    logger.info(`   Message ID: ${info.messageId}`);
    logger.info(`   Response: ${info.response}`);
    logger.info(`   Accepted: ${info.accepted}`);
    logger.info(`   Rejected: ${info.rejected}`);

    // Check if email was actually accepted
    if (info.rejected && info.rejected.length > 0) {
      logger.error(`⚠️ Email was rejected by server: ${info.rejected.join(', ')}`);
      return {
        success: false,
        error: `Email rejected: ${info.rejected.join(', ')}`,
        method: 'email',
        recipient: customerEmail
      };
    }

    return {
      success: true,
      messageId: info.messageId,
      method: 'email',
      recipient: customerEmail
    };
  } catch (error) {
    if (error.code === 'EAUTH') {
      logger.warn('⚠️ Gmail login failed. Set EMAIL_PASSWORD in server/.env to a Gmail App Password: https://myaccount.google.com/apppasswords');
    } else {
      logger.error('❌ Failed to send customer confirmation email:', error.message);
    }
    return {
      success: false,
      error: error.message,
      errorCode: error.code,
      method: 'email'
    };
  }
}

/**
 * Sends order notification email
 */
export async function sendOrderEmail(orderData, orderId = null) {
  const emailTransporter = initializeTransporter();
  
  if (!emailTransporter) {
    logger.warn('⚠️ Email transporter not initialized. Email will not be sent.');
    return {
      success: false,
      error: 'Email transporter not configured',
      method: 'email'
    };
  }

  // Get client's email and name from order data
  const clientEmail = orderData.email;
  const clientName = `${orderData.firstName} ${orderData.lastName}`;
  
  // Your email: orders are sent here on every checkout
  const recipientEmail = config.email.orderEmail || config.email.user;
  const emailUser = config.email.user;

  // Use client's email address as the sender
  // Note: Gmail UI will show "me" for your own emails, but the client's email
  // will be visible in the subject line and email headers
  const mailOptions = {
    from: `${clientEmail}`,
    replyTo: clientEmail,
    to: recipientEmail,
    subject: `🛍️ Order from: ${clientEmail} - ${orderId || 'Order'}`,
    text: formatOrderEmailText(orderData, orderId),
    html: formatOrderEmailHTML(orderData, orderId),
    headers: {
      'X-Client-Email': clientEmail,
      'X-Client-Name': clientName
    }
  };

  try {
    const info = await emailTransporter.sendMail(mailOptions);
    
    logger.info(`✅ Email sent successfully to ${recipientEmail}`);
    logger.info(`   From display: ${clientEmail}`);
    logger.info(`   Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      method: 'email',
      recipient: recipientEmail
    };
  } catch (error) {
    if (error.code === 'EAUTH') {
      logger.warn('⚠️ Gmail login failed. Set EMAIL_PASSWORD in server/.env to a Gmail App Password: https://myaccount.google.com/apppasswords');
    } else {
      logger.error('❌ Email sending error:', error.message);
    }
    // Even if there's an error, try with authenticated email but client email in display
    try {
      const fallbackOptions = {
        from: `${clientEmail}`,
        replyTo: clientEmail,
        to: recipientEmail,
        subject: `🛍️ New Order from ${clientEmail} - ${orderId || 'Order'}`,
        text: formatOrderEmailText(orderData, orderId),
        html: formatOrderEmailHTML(orderData, orderId)
      };
      const info = await emailTransporter.sendMail(fallbackOptions);
      logger.info(`✅ Email sent successfully (fallback) to ${recipientEmail}`);
      return {
        success: true,
        messageId: info.messageId,
        method: 'email',
        recipient: recipientEmail
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: error.message,
        method: 'email'
      };
    }
  }
}

