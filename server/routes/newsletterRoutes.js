import express from 'express';
import { subscribeNewsletter } from '../controllers/newsletterController.js';
import { newsletterRateLimiter } from '../middleware/security.js';

const router = express.Router();

router.post('/subscribe', newsletterRateLimiter, subscribeNewsletter);

export default router;
