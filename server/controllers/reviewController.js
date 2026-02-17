import logger from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to reviews JSON file (stores reviews persistently)
const REVIEWS_FILE = path.join(__dirname, '../data/reviews.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(REVIEWS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load reviews from file
async function loadReviews() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(REVIEWS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty array
      return [];
    }
    logger.error('Error loading reviews:', error);
    return [];
  }
}

// Save reviews to file
async function saveReviews(reviews) {
  try {
    await ensureDataDir();
    await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
  } catch (error) {
    logger.error('Error saving reviews:', error);
    throw error;
  }
}

/**
 * GET /api/reviews
 * Returns all reviews
 */
export async function getReviews(req, res, next) {
  try {
    const reviews = await loadReviews();
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
    const { rating, comment, author, photo } = req.body;

    // Validation
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be a number between 1 and 5',
      });
    }

    const reviews = await loadReviews();
    
    const newReview = {
      id: Date.now().toString(),
      rating,
      comment: comment || undefined,
      author: author || undefined,
      photo: photo || undefined,
      date: new Date().toISOString(),
      verified: true,
    };

    reviews.push(newReview);
    await saveReviews(reviews);

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
 * Deletes a review (admin only - you can add authentication later)
 */
export async function deleteReview(req, res, next) {
  try {
    const { reviewId } = req.params;

    const reviews = await loadReviews();
    const initialLength = reviews.length;
    const filteredReviews = reviews.filter((review) => review.id !== reviewId);

    if (filteredReviews.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: 'Review not found',
      });
    }

    await saveReviews(filteredReviews);

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    logger.error('deleteReview error:', error);
    next(error);
  }
}
