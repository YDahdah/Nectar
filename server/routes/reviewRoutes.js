import express from 'express';
import { getReviews, createReview, deleteReview } from '../controllers/reviewController.js';
import { httpCacheMiddleware } from '../middleware/httpCache.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// Get all reviews - public, cacheable
router.get(
  '/',
  httpCacheMiddleware({ maxAge: 60, etag: true }), // Cache for 1 minute
  cacheMiddleware(60 * 1000), // Application cache for 1 minute
  getReviews
);

// Create a new review
router.post('/', createReview);

// Delete a review (admin only - add auth middleware later if needed)
router.delete('/:reviewId', deleteReview);

export default router;
