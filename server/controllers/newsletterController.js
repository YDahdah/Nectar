import Joi from 'joi';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import { ApiError } from '../middleware/errorHandler.js';

// In-memory store for newsletter emails (optional: persist to DB or file later)
const subscribers = new Set();

const emailSchema = Joi.object({
  email: Joi.string().required().email().trim().lowercase().max(255),
});

/**
 * POST /api/newsletter/subscribe
 * Subscribe an email to the newsletter.
 */
export async function subscribeNewsletter(req, res, next) {
  try {
    const { error, value } = emailSchema.validate(req.body);
    if (error) {
      throw new ApiError(400, error.details[0].message || 'Invalid email');
    }

    const { email } = value;

    if (subscribers.has(email)) {
      return res.status(200).json({
        success: true,
        message: 'You are already subscribed.',
      });
    }

    subscribers.add(email);
    logger.info(`Newsletter signup: ${email} (total: ${subscribers.size})`);

    // Optional: send confirmation to ORDER_EMAIL so owner has a list
    if (config.email?.orderEmail) {
      try {
        const nodemailer = (await import('nodemailer')).default;
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: config.email.user,
            pass: config.email.password,
          },
        });
        await transporter.sendMail({
          from: config.email.user,
          to: config.email.orderEmail,
          subject: `[Nectar] New newsletter signup: ${email}`,
          text: `New newsletter subscriber: ${email}\nTotal subscribers: ${subscribers.size}`,
        });
      } catch (mailErr) {
        logger.warn('Could not send newsletter signup notification email:', mailErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for subscribing!',
    });
  } catch (err) {
    next(err);
  }
}
