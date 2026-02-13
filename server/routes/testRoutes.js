import express from 'express';
import { testEmail } from '../controllers/testController.js';
import { validateTestEmailData } from '../middleware/validation.js';
import { rateLimiter } from '../middleware/security.js';

const router = express.Router();

// Test email endpoint
router.post('/email', rateLimiter, validateTestEmailData, testEmail);

export default router;
