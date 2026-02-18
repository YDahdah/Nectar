import logger from '../utils/logger.js';
import * as reviewModel from '../models/reviewModel.js';

/**
 * GET /api/reviews
 * Returns all reviews
 */
export async function getReviews(req, res, next) {
  try {
    const reviews = await reviewModel.getAllReviews();
    res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    logger.error('getReviews error:', error);
    next(error);
  }
}

/**
 * POST /api/reviews
 * Creates a new review
 */
export async function createReview(req, res, next) {
  try {
    const { rating, comment, author, photo, userId } = req.body;

    // Validation
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be a number between 1 and 5',
      });
    }

    const newReview = await reviewModel.createReview({
      rating,
      comment,
      author,
      photo,
      userId,
    });

    res.status(201).json({
      success: true,
      review: newReview,
    });
  } catch (error) {
    logger.error('createReview error:', error);
    next(error);
  }
}

/**
 * DELETE /api/reviews/:reviewId
 * Deletes a review (users can delete their own, admins can delete any)
 */
export async function deleteReview(req, res, next) {
  try {
    const { reviewId } = req.params;
    const { userId } = req.body; // Get userId from request body

    // If userId is provided, verify ownership; if not, allow deletion (admin mode)
    const deleted = await reviewModel.deleteReview(reviewId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Review not found or you do not have permission to delete it',
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    logger.error('deleteReview error:', error);
    
    // Handle ownership verification errors
    if (error.message.includes('only delete your own')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }
    
    next(error);
  }
}
