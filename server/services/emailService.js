import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import nodemailer from 'nodemailer';
import config from '../config/config.js';
import logger from '../utils/logger.js';

const __emailServiceDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__emailServiceDir, '..', '.env') });

function logEmailEnvCheck(label = '[emailService] ENV CHECK') {
  // eslint-disable-next-line no-console
  console.log(label, {
    EMAIL_USER: process.env.EMAIL_USER ? 'SET ✓' : 'MISSING ✗',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET ✓' : 'MISSING ✗',
    OWNER_EMAIL: process.env.OWNER_EMAIL ? 'SET ✓' : 'MISSING ✗',
    ORDER_EMAIL: process.env.ORDER_EMAIL ? 'SET ✓' : 'MISSING ✗',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET ✓' : 'MISSING ✗',
    NODE_ENV: process.env.NODE_ENV || 'unset',
  });
}

// Resend HTTP API. Used as the primary owner-notification transport whenever
// RESEND_API_KEY is set, because Render's free tier blocks outbound SMTP to
// Gmail (ports 587/465), which makes nodemailer hang and quietly drop the
// order email. Resend is a plain HTTPS call so it works on every Render plan.
//
// To enable:
//   1) Sign up at https://resend.com and copy your API key (starts with re_)
//   2) Set RESEND_API_KEY in server/.env (and on Render)
//   3) Optionally set RESEND_FROM_EMAIL to a verified sender. Defaults to
//      Resend's shared sandbox sender "onboarding@resend.dev", which can only
//      deliver to the email address that owns the Resend account — which is
//      fine here because we only email the shop owner.
function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim());
}

async function sendViaResend({ to, subject, html }) {
  try {
    // eslint-disable-next-line no-console
    console.log("[Resend] Starting send", { to, subject });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Nectar Perfume <onboarding@resend.dev>",
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    clearTimeout(timeout);

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error("[Resend] Failed", response.status, data);
      return { success: false, status: response.status, error: data };
    }

    // eslint-disable-next-line no-console
    console.log("[Resend] Success", data);
    return { success: true, data };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Resend] Exception", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message };
  }
}

// One-shot boot log so production logs immediately tell us whether the
// hosting platform actually injected the email env vars (Render/Railway/VPS/etc.).
// Uses raw console.log so it shows even if `logger` is misconfigured in prod.
logEmailEnvCheck('[emailService] ENV CHECK (module load)');

// Create transporter - using Gmail SMTP
let transporter = null;

const PLACEHOLDER_EMAIL = 'your-email@gmail.com';

function isPlaceholderEmail(user) {
  if (!user || typeof user !== 'string') return true;
  const u = user.trim().toLowerCase();
  return u === '' || u === PLACEHOLDER_EMAIL || u.includes('your-email') || u.includes('example.com');
}

/**
 * Reset the email transporter cache
 * Call this if email credentials change and you need to reload them
 */
export function resetTransporter() {
  if (transporter) {
    transporter.close();
    transporter = null;
    logger.info('🔄 Email transporter cache reset');
  }
}

/**
 * Safely verify SMTP credentials and connectivity WITHOUT sending any email.
 *
 * Used by diagnostic endpoints (e.g. /api/health/email). Never throws — always
 * resolves with a structured result so the route handler can return HTTP 200
 * JSON in every case. Hard-capped at `timeoutMs` (default 8000ms) so a hung
 * SMTP connection can never stall the request.
 *
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=8000] - Max time to wait for verify().
 * @returns {Promise<{
 *   success: boolean,
 *   emailConfigured: boolean,
 *   env: Record<string, string>,
 *   error?: string,
 *   errorCode?: string,
 * }>}
 */
export async function verifyEmailConfig({ timeoutMs = 8000 } = {}) {
  const env = {
    EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'MISSING',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET' : 'MISSING',
    OWNER_EMAIL: process.env.OWNER_EMAIL ? 'SET' : 'MISSING',
    ORDER_EMAIL: process.env.ORDER_EMAIL ? 'SET' : 'MISSING',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV || 'unset',
  };

  const resendConfigured = isResendConfigured();

  // When Resend is configured, we deliberately skip transporter.verify() —
  // Resend is the only transport we will use, and probing Gmail SMTP on Render
  // tends to hang for the full timeout (port 587/465 are blocked outbound).
  if (resendConfigured) {
    return {
      success: true,
      emailConfigured: true,
      primaryTransport: 'resend',
      smtp: { available: false, reason: 'Gmail SMTP disabled (RESEND_API_KEY set)' },
      resend: { configured: true },
      env,
      message: 'Resend HTTP API configured; Gmail SMTP fallback disabled',
    };
  }

  try {
    const t = initializeTransporter();
    if (!t) {
      return {
        success: false,
        emailConfigured: false,
        env,
        error: 'Email check failed',
        details: 'Transporter not initialised (missing EMAIL_USER / EMAIL_PASSWORD or placeholder value)',
      };
    }

    const verifyResult = await Promise.race([
      t.verify().then(() => ({ ok: true })).catch((err) => ({ ok: false, err })),
      new Promise((resolve) =>
        setTimeout(() => resolve({ ok: false, timedOut: true }), timeoutMs),
      ),
    ]);

    if (verifyResult.ok) {
      return {
        success: true,
        emailConfigured: true,
        primaryTransport: resendConfigured ? 'resend' : 'smtp',
        smtp: { available: true },
        resend: { configured: resendConfigured },
        env,
        message: resendConfigured
          ? 'Resend HTTP API configured; Gmail SMTP also verified (fallback ready)'
          : 'SMTP credentials verified (no email sent)',
      };
    }

    if (verifyResult.timedOut) {
      logger.warn('verifyEmailConfig: SMTP verify timed out', { timeoutMs });
      if (resendConfigured) {
        // SMTP is blocked (the common Render free-tier case) but Resend is
        // configured — the owner email path will still work.
        return {
          success: true,
          emailConfigured: true,
          primaryTransport: 'resend',
          smtp: {
            available: false,
            reason: `SMTP verify timed out after ${timeoutMs}ms (host likely blocks outbound SMTP)`,
          },
          resend: { configured: true },
          env,
          message: 'Resend HTTP API will be used (Gmail SMTP unreachable)',
        };
      }
      return {
        success: false,
        emailConfigured: false,
        env,
        error: 'Email check failed',
        details: `SMTP verify timed out after ${timeoutMs}ms`,
      };
    }

    const err = verifyResult.err || {};
    logger.warn('verifyEmailConfig: SMTP verify failed', {
      message: err.message,
      code: err.code,
    });
    if (resendConfigured) {
      return {
        success: true,
        emailConfigured: true,
        primaryTransport: 'resend',
        smtp: { available: false, reason: err.message, errorCode: err.code },
        resend: { configured: true },
        env,
        message: 'Resend HTTP API will be used (Gmail SMTP unreachable)',
      };
    }
    return {
      success: false,
      emailConfigured: false,
      env,
      error: 'Email check failed',
      details: err.message,
      errorCode: err.code,
    };
  } catch (err) {
    logger.error('verifyEmailConfig: unexpected exception', {
      message: err?.message,
      stack: err?.stack,
    });
    return {
      success: false,
      emailConfigured: false,
      env,
      error: 'Email check failed',
      details: err?.message,
    };
  }
}

function initializeTransporter() {
  // Always check current config values
  const currentEmailUser = config.email.user;
  const currentEmailPassword = config.email.password;
  
  // If transporter exists, check if credentials have changed
  if (transporter) {
    // Get the stored credentials from the transporter
    const storedUser = transporter.options?.auth?.user;
    const storedPass = transporter.options?.auth?.pass;
    
    // If credentials changed, reset the transporter
    if (storedUser !== currentEmailUser || storedPass !== currentEmailPassword) {
      logger.info('🔄 Email credentials changed, resetting transporter...');
      logger.info(`   Old: ${storedUser || 'N/A'} -> New: ${currentEmailUser || 'N/A'}`);
      try {
        transporter.close();
      } catch (e) {
        // Ignore errors when closing
      }
      transporter = null;
    } else {
      // Credentials haven't changed, return cached transporter
      return transporter;
    }
  }

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

  // Remove any spaces from password (Gmail app passwords sometimes have spaces when copied)
  const cleanPassword = emailPassword.replace(/\s+/g, '');

  // Explicitly use Gmail SMTP on port 587 (STARTTLS) instead of `service: 'gmail'`
  // which defaults to port 465 (SMTPS). Many cloud hosts — including Render's
  // free tier — block or throttle outbound 465 but allow 587. The local CLI
  // test (server/test-email.js) showed Gmail accepts these credentials, so the
  // remaining failure mode is the egress port. SMTP_PORT can override (e.g. set
  // it to 465 to restore SMTPS behaviour without redeploying code).
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpSecure = smtpPort === 465; // 465 = TLS on connect; 587 = STARTTLS upgrade
  logger.info(
    `📧 SMTP transport: smtp.gmail.com:${smtpPort} ${smtpSecure ? '(SMTPS)' : '(STARTTLS)'}`,
  );

  // SMTP timeouts: without these, nodemailer can hang indefinitely on a bad/slow
  // connection (wrong creds, network block, Gmail outage) and stall the entire
  // /api/orders/checkout request until the frontend abort kicks in.
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: smtpPort,
    secure: smtpSecure,
    requireTLS: !smtpSecure, // STARTTLS upgrade required on 587
    auth: {
      user: emailUser,
      pass: cleanPassword,
    },
    connectionTimeout: 10_000, // 10s to establish TCP/TLS connection
    greetingTimeout: 10_000,   // 10s to wait for SMTP greeting
    socketTimeout: 20_000,     // 20s for data transfer (sending the message)
    pool: true,                // reuse connections across requests
    maxConnections: 3,
    maxMessages: 100,
  });

  // Verify transporter connection (async; don't block).
  // Skipped entirely when Resend is configured — on hosts like Render that
  // block outbound SMTP, this verify call hangs and burns the request budget.
  if (!isResendConfigured()) {
    transporter.verify(function (error, success) {
      if (error) {
        if (error.code === 'EAUTH') {
          logger.error('⚠️ Gmail authentication failed!');
          logger.error('   Check your EMAIL_USER and EMAIL_PASSWORD in server/.env');
          logger.error('   EMAIL_PASSWORD must be a Gmail App Password (not your regular password)');
          logger.error('   Create one at: https://myaccount.google.com/apppasswords');
          logger.error('   Error details:', error.message);
        } else {
          logger.error('❌ Email transporter verification failed:', error.message);
        }
      } else {
        logger.info('✅ Email transporter verified successfully');
        logger.info(`   Ready to send emails from: ${emailUser}`);
      }
    });
  } else {
    logger.info('ℹ️ Skipping transporter.verify() because RESEND_API_KEY is set (Resend is the only transport).');
  }

  return transporter;
}

/**
 * Formats order data into HTML email format
 */
function formatOrderEmailHTML(orderData, orderId = null) {
  if (!orderData || typeof orderData !== 'object') {
    logger.warn('formatOrderEmailHTML received invalid orderData; using safe defaults');
    orderData = {};
  }

  const {
    firstName = '',
    lastName = '',
    address = '',
    city = '',
    caza = '',
    phone = '',
    email = '',
    country = 'Lebanon',
    items = [],
    shippingCost = 0,
    totalPrice: providedTotalPrice,
    subtotal: providedSubtotal,
    paymentMethod = 'Cash on Delivery',
    shippingMethod = 'Delivery (2-4 days)'
  } = orderData || {};

  // Use provided subtotal or calculate if not available
  const subtotal = providedSubtotal ?? (items?.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0) || 0);
  const totalItems = items?.reduce((sum, item) => sum + (item?.quantity || 0), 0) || 0;
  
  // Ensure totalPrice is defined (use calculated if not provided)
  const finalTotalPrice = providedTotalPrice ?? (subtotal + (Number(shippingCost) || 0));

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
          <p class="total">TOTAL: $${finalTotalPrice.toFixed(2)}</p>
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
  if (!orderData || typeof orderData !== 'object') {
    logger.warn('formatOrderEmailText received invalid orderData; using safe defaults');
    orderData = {};
  }

  const {
    firstName = '',
    lastName = '',
    address = '',
    city = '',
    caza = '',
    phone = '',
    email = '',
    country = 'Lebanon',
    items = [],
    shippingCost = 0,
    totalPrice: providedTotalPrice,
    subtotal: providedSubtotal,
    paymentMethod = 'Cash on Delivery',
    shippingMethod = 'Delivery (2-4 days)'
  } = orderData || {};

  // Use provided subtotal or calculate if not available
  const subtotal = providedSubtotal ?? (items?.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0) || 0);
  const totalItems = items?.reduce((sum, item) => sum + (item?.quantity || 0), 0) || 0;
  
  // Ensure totalPrice is defined (use calculated if not provided)
  const finalTotalPrice = providedTotalPrice ?? (subtotal + (Number(shippingCost) || 0));

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
  text += `TOTAL: $${finalTotalPrice.toFixed(2)}\n\n`;

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Action Required: Process this order 📦\n`;

  return text;
}

/**
 * Formats customer confirmation email into HTML format
 */
function formatCustomerConfirmationEmailHTML(orderData, orderId = null) {
  if (!orderData || typeof orderData !== 'object') {
    logger.warn('formatCustomerConfirmationEmailHTML received invalid orderData; using safe defaults');
    orderData = {};
  }

  const {
    firstName = '',
    lastName = '',
    address = '',
    city = '',
    caza = '',
    phone = '',
    email = '',
    country = 'Lebanon',
    items = [],
    shippingCost = 0,
    totalPrice: providedTotalPrice,
    subtotal: providedSubtotal,
    paymentMethod = 'Cash on Delivery',
    shippingMethod = 'Delivery (2-4 days)'
  } = orderData || {};

  // Use provided subtotal or calculate if not available
  const subtotal = providedSubtotal ?? (items?.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0) || 0);
  const totalItems = items?.reduce((sum, item) => sum + (item?.quantity || 0), 0) || 0;
  
  // Ensure totalPrice is defined (use calculated if not provided)
  const finalTotalPrice = providedTotalPrice ?? (subtotal + (Number(shippingCost) || 0));

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
          <p><strong>Shipping Method:</strong> ${shippingMethod || 'Delivery (2-4 days)'}</p>
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
          <p class="total">TOTAL: $${finalTotalPrice.toFixed(2)}</p>
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
          Your order will be delivered within 2-4 days.
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
  if (!orderData || typeof orderData !== 'object') {
    logger.warn('formatCustomerConfirmationEmailText received invalid orderData; using safe defaults');
    orderData = {};
  }

  const {
    firstName = '',
    lastName = '',
    address = '',
    city = '',
    caza = '',
    phone = '',
    email = '',
    country = 'Lebanon',
    items = [],
    shippingCost = 0,
    totalPrice: providedTotalPrice,
    subtotal: providedSubtotal,
    paymentMethod = 'Cash on Delivery',
    shippingMethod = 'Delivery (2-4 days)'
  } = orderData || {};

  // Use provided subtotal or calculate if not available
  const subtotal = providedSubtotal ?? (items?.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0) || 0);
  const totalItems = items?.reduce((sum, item) => sum + (item?.quantity || 0), 0) || 0;
  
  // Ensure totalPrice is defined (use calculated if not provided)
  const finalTotalPrice = providedTotalPrice ?? (subtotal + (Number(shippingCost) || 0));

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
  text += `Shipping Method: ${shippingMethod || 'Delivery (2-4 days)'}\n`;
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
  text += `TOTAL: $${finalTotalPrice.toFixed(2)}\n\n`;

  text += `📍 DELIVERY ADDRESS\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `${address}\n`;
  text += `${city}, ${caza}\n`;
  text += `${country || 'Lebanon'}\n`;
  text += `Phone: ${phone}\n\n`;

  text += `📬 WHAT'S NEXT?\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `We're processing your order and will contact you soon via WhatsApp to confirm the details. `;
  text += `Your order will be delivered within 2-4 days.\n\n`;

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Thank you for shopping with Nectar Perfume Shop! 🛍️\n`;
  text += `If you have any questions, please don't hesitate to contact us.\n`;
  text += `This is an automated confirmation email. Please save this email for your records.\n`;

  return text;
}

/**
 * Sends order confirmation email to customer.
 *
 * Transport strategy mirrors `sendOwnerOrderNotification`:
 *   1. Resend HTTP API (preferred) — works on Render free tier where outbound
 *      SMTP is blocked. NOTE: Resend's default sandbox sender
 *      (`onboarding@resend.dev`) ONLY delivers to the email that owns the
 *      Resend account. To send confirmations to real customers you MUST
 *      verify a domain in Resend and set `RESEND_FROM_EMAIL`
 *      (e.g. `orders@perfumenectar.com`).
 *   2. Gmail SMTP fallback — only works on hosts that allow outbound SMTP.
 */
export async function sendCustomerConfirmationEmail(orderData, orderId = null) {
  // Hard guarantee: this function never throws. Always returns
  //   { success: true, id }  OR  { success: false, error }
  // so the caller can safely run it in a background `setImmediate` without
  // risking an uncaughtException that would let Render restart the process.
  try {
    let customerEmail = orderData?.email;
    const customerName = `${orderData?.firstName || ''} ${orderData?.lastName || ''}`.trim();

    if (!customerEmail) {
      logger.warn('⚠️ Customer email not provided. Skipping customer confirmation email.');
      return { success: false, error: 'Customer email not provided' };
    }

    customerEmail = customerEmail.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      logger.error(`❌ Invalid email address format: ${customerEmail}`);
      return { success: false, error: `Invalid email address format: ${customerEmail}` };
    }

    const invalidDomains = ['example.com', 'test.com', 'example.org', 'test.org', 'example.net'];
    const emailDomain = customerEmail.split('@')[1];
    if (invalidDomains.includes(emailDomain)) {
      logger.error(`❌ Invalid email domain (placeholder/test domain): ${customerEmail}`);
      return {
        success: false,
        error: `Please use a real email address. ${emailDomain} is a test domain that doesn't accept email.`,
      };
    }

    logger.info(`📧 Preparing to send confirmation email to customer: ${customerEmail}`);

    const subject = `✨ Order Confirmation - ${orderId || 'Your Order'}`;
    const html = formatCustomerConfirmationEmailHTML(orderData, orderId);
    const textBody = formatCustomerConfirmationEmailText(orderData, orderId);

    // When RESEND_API_KEY is set, Resend is the ONLY transport we use.
    // No Gmail SMTP fallback — on Render free tier outbound SMTP is blocked,
    // and trying it just stalls the worker until the platform kills it.
    if (isResendConfigured()) {
      // eslint-disable-next-line no-console
      console.log('Sending customer email via Resend...');
      return await sendViaResend({ to: customerEmail, subject, html });
    }

    // Fallback path: Gmail SMTP. Only reached when RESEND_API_KEY is NOT set
    // (i.e. local dev without Resend). Production should always have Resend.
    const emailTransporter = initializeTransporter();

    if (!emailTransporter) {
      logger.warn('⚠️ Email transporter not initialized. Customer confirmation email will not be sent.');
      return { success: false, error: 'Email transporter not configured' };
    }

    const emailUser = config.email.user;
    const shopName = config.email.shopName;

    const mailOptions = {
      from: `"${shopName}" <${emailUser}>`,
      replyTo: emailUser,
      to: customerEmail,
      subject,
      text: textBody,
      html,
      headers: {
        'X-Customer-Name': customerName,
        'X-Order-ID': orderId || 'N/A',
        'List-Unsubscribe': `<mailto:${emailUser}?subject=Unsubscribe>`,
      },
    };

    try {
      logger.info(`📧 Attempting to send customer email via SMTP:`);
      logger.info(`   From: ${emailUser}`);
      logger.info(`   To: ${customerEmail}`);
      logger.info(`   Subject: ${mailOptions.subject}`);

      const info = await emailTransporter.sendMail(mailOptions);

      logger.info(`✅ Customer confirmation email sent successfully to ${customerEmail}`);
      logger.info(`   Message ID: ${info.messageId}`);
      logger.info(`   Response: ${info.response}`);

      if (info.rejected && info.rejected.length > 0) {
        logger.error(`⚠️ Email was rejected by server: ${info.rejected.join(', ')}`);
        return {
          success: false,
          error: `Email rejected: ${info.rejected.join(', ')}`,
        };
      }

      return { success: true, id: info.messageId, recipient: customerEmail };
    } catch (error) {
      if (error.code === 'EAUTH') {
        logger.warn('⚠️ Gmail login failed. Set EMAIL_PASSWORD in server/.env to a Gmail App Password.');
      } else {
        logger.error('❌ Failed to send customer confirmation email:', error.message);
      }
      return { success: false, error: error.message };
    }
  } catch (err) {
    // Last-resort catch-all so the function ALWAYS resolves to a result object.
    // eslint-disable-next-line no-console
    console.log('Customer email failed:', err?.message);
    logger.error('❌ Unexpected exception in sendCustomerConfirmationEmail', {
      message: err?.message,
      stack: err?.stack,
    });
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

/**
 * Resolves shop owner inbox for new-order alerts.
 * Priority: OWNER_EMAIL → ORDER_EMAIL → config.orderEmail → sending account (EMAIL_USER).
 */
function resolveOwnerNotificationEmail() {
  return (
    (process.env.OWNER_EMAIL || "").trim() ||
    (process.env.ORDER_EMAIL || "").trim() ||
    (config.email.orderEmail || "").trim() ||
    (config.email.user || "").trim()
  );
}

/**
 * Sends new-order notification HTML email to the shop owner (OWNER_EMAIL or fallbacks).
 * @param {Object} order - Full order payload (customer fields, items, totals). Use `orderId` on the object or pass via legacy sendOrderEmail(orderData, id).
 */
export async function sendOwnerOrderNotification(order) {
  // Hard guarantee: this function never throws. Always returns
  //   { success: true, id }  OR  { success: false, error }
  // The orderController fires this in `setImmediate` AFTER responding to the
  // client, so any unhandled rejection here would crash the Node process and
  // make Render restart the worker mid-request. The outer try/catch prevents that.
  try {
    const orderId = order?.orderId ?? null;

    logger.info('📧 sendOwnerOrderNotification called');
    logger.info(`   Order ID: ${orderId || 'N/A'}`);

    if (!order || typeof order !== 'object') {
      logger.error('❌ sendOwnerOrderNotification: order is missing or invalid');
      return { success: false, error: 'Order data is missing' };
    }

    const recipientEmail = resolveOwnerNotificationEmail();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      logger.warn(
        '⚠️ OWNER_EMAIL / ORDER_EMAIL / order inbox not configured. Owner order email skipped.',
      );
      return { success: false, error: 'Owner email not configured' };
    }

    const clientEmailEarly = order.email || 'No email provided';
    const clientNameEarly =
      `${order.firstName || ''} ${order.lastName || ''}`.trim() || 'Customer';
    const subject = `🛍️ New Order from ${clientNameEarly} (${clientEmailEarly}) — ${orderId || 'Order'}`;
    const html = formatOrderEmailHTML(order, orderId);
    const textBody = formatOrderEmailText(order, orderId);
    const replyToEmail =
      clientEmailEarly !== 'No email provided' && clientEmailEarly ? clientEmailEarly : undefined;

    // When RESEND_API_KEY is set, Resend is the ONLY transport we use.
    // No Gmail SMTP fallback in production — outbound SMTP is blocked on Render
    // free tier and just stalls the worker until the platform kills it.
    if (isResendConfigured()) {
      // eslint-disable-next-line no-console
      console.log('Sending owner email via Resend...');
      return await sendViaResend({ to: process.env.OWNER_EMAIL || process.env.ORDER_EMAIL, subject, html });
    }

    // Fallback path: Gmail SMTP. Only reached when RESEND_API_KEY is NOT set.
    const emailTransporter = initializeTransporter();

    if (!emailTransporter) {
      logger.error('❌ Email transporter not initialized. Owner notification will not be sent.');
      return { success: false, error: 'Email transporter not configured' };
    }

    const emailUser = config.email.user;

    const mailOptions = {
      from: `"${config.email.shopName || 'Nectar Shop'}" <${emailUser}>`,
      replyTo: replyToEmail || emailUser,
      to: recipientEmail,
      subject,
      text: textBody,
      html,
      headers: {
        'X-Client-Email': clientEmailEarly,
        'X-Client-Name': clientNameEarly,
        'X-Order-ID': orderId || 'N/A',
      },
    };

    try {
      logger.info(`📧 Sending owner order notification via SMTP:`);
      logger.info(`   From: ${emailUser}`);
      logger.info(`   To: ${recipientEmail}`);

      const info = await emailTransporter.sendMail(mailOptions);

      logger.info(`✅ Owner notification sent to ${recipientEmail}`);
      logger.info(`   Message ID: ${info.messageId}`);

      if (info.rejected && info.rejected.length > 0) {
        return {
          success: false,
          error: `Email rejected: ${info.rejected.join(', ')}`,
        };
      }

      return { success: true, id: info.messageId, recipient: recipientEmail };
    } catch (error) {
      logger.error('❌ Owner notification email error:', {
        message: error.message,
        code: error.code,
      });
      return { success: false, error: error.message };
    }
  } catch (err) {
    // Last-resort catch-all so the function ALWAYS resolves to a result object.
    // eslint-disable-next-line no-console
    console.log('Owner email failed:', err?.message);
    logger.error('❌ Unexpected exception in sendOwnerOrderNotification', {
      message: err?.message,
      stack: err?.stack,
    });
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

/**
 * @deprecated Prefer sendOwnerOrderNotification({ ...orderData, orderId }) — kept for tests and scripts.
 */
export async function sendOrderEmail(orderData, orderId = null) {
  return sendOwnerOrderNotification({
    ...orderData,
    orderId: orderId ?? orderData?.orderId ?? null,
  });
}

