import nodemailer from 'nodemailer';
import pkg from 'google-auth-library';
const { google } = pkg;
import logger from '../utils/logger.js';

/**
 * Gmail SMTP Email Service
 * Supports both OAuth2 and App Password authentication
 */

let transporter = null;
let authMethod = null; // 'oauth2' | 'app_password' | null

/**
 * Initialize OAuth2 transporter using refresh token
 */
async function createOAuth2Transporter() {
  const {
    GMAIL_USER,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
  } = process.env;

  if (!GMAIL_USER || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('OAuth2 configuration incomplete. Required: GMAIL_USER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN');
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // Redirect URI (not used for refresh token flow)
  );

  oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN,
  });

  // Get access token
  const accessToken = await oauth2Client.getAccessToken();

  if (!accessToken.token) {
    throw new Error('Failed to obtain OAuth2 access token. Check your refresh token.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: GMAIL_USER,
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      refreshToken: GOOGLE_REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });
}

/**
 * Initialize App Password transporter (fallback)
 */
function createAppPasswordTransporter() {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error('App Password configuration incomplete. Required: GMAIL_USER, GMAIL_APP_PASSWORD');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
}

/**
 * Initialize email transporter (OAuth2 preferred, App Password fallback)
 */
async function initializeTransporter() {
  if (transporter) {
    return transporter;
  }

  // Try OAuth2 first (preferred)
  if (
    process.env.GMAIL_USER &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  ) {
    try {
      logger.info('🔐 Initializing Gmail SMTP with OAuth2...');
      transporter = await createOAuth2Transporter();
      authMethod = 'oauth2';
      
      // Verify connection
      await transporter.verify();
      logger.info('✅ Gmail OAuth2 transporter initialized successfully');
      return transporter;
    } catch (error) {
      logger.warn(`⚠️ OAuth2 initialization failed: ${error.message}`);
      logger.info('🔄 Falling back to App Password method...');
      transporter = null;
    }
  }

  // Fallback to App Password
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      logger.info('🔐 Initializing Gmail SMTP with App Password...');
      transporter = createAppPasswordTransporter();
      authMethod = 'app_password';
      
      // Verify connection
      await transporter.verify();
      logger.info('✅ Gmail App Password transporter initialized successfully');
      return transporter;
    } catch (error) {
      logger.error(`❌ App Password initialization failed: ${error.message}`);
      throw new Error(`Email service initialization failed: ${error.message}`);
    }
  }

  throw new Error(
    'No email configuration found. Set either OAuth2 (GMAIL_USER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN) or App Password (GMAIL_USER, GMAIL_APP_PASSWORD) environment variables.'
  );
}

/**
 * Send email using Gmail SMTP
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.html] - HTML body
 * @param {string} [options.from] - Sender email (defaults to GMAIL_USER)
 * @param {string[]} [options.cc] - CC recipients
 * @param {string[]} [options.bcc] - BCC recipients
 * @param {Object[]} [options.attachments] - Email attachments
 * @returns {Promise<Object>} - Nodemailer send result
 * @throws {Error} - If email sending fails
 */
export async function sendEmail({ to, subject, text, html, from, cc, bcc, attachments }) {
  // Validate inputs
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    throw new Error('Invalid recipient email address. "to" must be a valid email string.');
  }

  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    throw new Error('Email subject is required and must be a non-empty string.');
  }

  if (!text && !html) {
    throw new Error('Either "text" or "html" body must be provided.');
  }

  // Initialize transporter if needed
  const emailTransporter = await initializeTransporter();

  if (!emailTransporter) {
    throw new Error('Email transporter not initialized. Check your email configuration.');
  }

  const fromEmail = from || process.env.GMAIL_USER;

  if (!fromEmail) {
    throw new Error('Sender email not configured. Set GMAIL_USER environment variable.');
  }

  // Prepare mail options
  const mailOptions = {
    from: fromEmail,
    to,
    subject: subject.trim(),
    ...(text && { text }),
    ...(html && { html }),
    ...(cc && Array.isArray(cc) && cc.length > 0 && { cc }),
    ...(bcc && Array.isArray(bcc) && bcc.length > 0 && { bcc }),
    ...(attachments && Array.isArray(attachments) && attachments.length > 0 && { attachments }),
  };

  try {
    logger.info(`📧 Sending email to ${to} (subject: ${subject}) using ${authMethod}...`);
    const result = await emailTransporter.sendMail(mailOptions);
    logger.info(`✅ Email sent successfully. Message ID: ${result.messageId}`);
    return result;
  } catch (error) {
    logger.error(`❌ Failed to send email: ${error.message}`, error);
    
    // Provide meaningful error messages
    if (error.code === 'EAUTH') {
      throw new Error('Authentication failed. Check your OAuth2 credentials or App Password.');
    } else if (error.code === 'EENVELOPE') {
      throw new Error(`Invalid email address: ${error.message}`);
    } else if (error.code === 'ECONNECTION') {
      throw new Error('Connection to Gmail SMTP server failed. Check your internet connection.');
    } else {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}

/**
 * Get current authentication method
 */
export function getAuthMethod() {
  return authMethod;
}

/**
 * Test email configuration
 */
export async function testEmailConfig() {
  try {
    const emailTransporter = await initializeTransporter();
    await emailTransporter.verify();
    return {
      success: true,
      method: authMethod,
      message: `Email service configured successfully using ${authMethod}`,
    };
  } catch (error) {
    return {
      success: false,
      method: authMethod,
      error: error.message,
    };
  }
}
