import express from 'express';
import { sendEmail, testEmailConfig } from '../services/gmailService.js';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';
import { httpCacheMiddleware } from '../middleware/httpCache.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

/**
 * Rate limiter for email endpoint
 * Limits: 10 emails per hour per IP
 */
const emailRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: {
    error: 'Too many email requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Validation middleware for email request
 */
const validateEmailRequest = [
  body('to')
    .isEmail()
    .withMessage('Valid recipient email address is required')
    .normalizeEmail(),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be between 1 and 200 characters'),
  body('text')
    .optional()
    .isString()
    .withMessage('Text body must be a string'),
  body('html')
    .optional()
    .isString()
    .withMessage('HTML body must be a string'),
  body('from')
    .optional()
    .isEmail()
    .withMessage('From email must be valid')
    .normalizeEmail(),
  body('cc')
    .optional()
    .isArray()
    .withMessage('CC must be an array of email addresses'),
  body('cc.*')
    .optional()
    .isEmail()
    .withMessage('Each CC address must be a valid email'),
  body('bcc')
    .optional()
    .isArray()
    .withMessage('BCC must be an array of email addresses'),
  body('bcc.*')
    .optional()
    .isEmail()
    .withMessage('Each BCC address must be a valid email'),
];

/**
 * POST /send-email
 * Send an email via Gmail SMTP
 * 
 * Request body:
 * {
 *   "to": "recipient@example.com",
 *   "subject": "Email Subject",
 *   "text": "Plain text body (optional if html provided)",
 *   "html": "<h1>HTML body</h1> (optional if text provided)",
 *   "from": "sender@example.com (optional, defaults to GMAIL_USER)",
 *   "cc": ["cc1@example.com"] (optional),
 *   "bcc": ["bcc1@example.com"] (optional)
 * }
 */
router.post('/send-email', emailRateLimiter, validateEmailRequest, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { to, subject, text, html, from, cc, bcc, attachments } = req.body;

    // Ensure at least one body format is provided
    if (!text && !html) {
      return res.status(400).json({
        success: false,
        error: 'Either "text" or "html" body must be provided',
      });
    }

    // Send email
    const result = await sendEmail({
      to,
      subject,
      text,
      html,
      from,
      cc,
      bcc,
      attachments,
    });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
    });
  } catch (error) {
    logger.error('Email sending error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email',
    });
  }
});

/**
 * GET /test-email-config
 * Test email configuration WITHOUT sending an email.
 *
 * Guarantees:
 *   - Never sends a real email (uses transporter.verify() only).
 *   - Never hangs (8s hard cap on SMTP verify).
 *   - Never returns 5xx — always HTTP 200 with a structured JSON body so a
 *     broken email setup can't trip Render's upstream 502.
 *
 * Cached for 5 minutes since config rarely changes.
 */
router.get(
  '/test-email-config',
  httpCacheMiddleware({ maxAge: 300, private: true }),
  cacheMiddleware(5 * 60 * 1000),
  async (req, res) => {
    try {
      const result = await testEmailConfig({ timeoutMs: 8000 });
      return res.status(200).json(result);
    } catch (error) {
      logger.error('test-email-config: unexpected exception', {
        message: error?.message,
        stack: error?.stack,
      });
      return res.status(200).json({
        success: false,
        emailConfigured: false,
        error: 'Email check failed',
        details: error?.message,
      });
    }
  },
);

export default router;
