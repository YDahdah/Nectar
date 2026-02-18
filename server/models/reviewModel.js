/**
 * Review Model - Database operations for reviews
 * Uses MongoDB through the database pool
 */

import { getPool } from '../utils/db-pool.js';
import logger from '../utils/logger.js';

const COLLECTION_NAME = 'reviews';

/**
 * Get all reviews from the database
 * @returns {Promise<Array>} Array of review documents
 */
export async function getAllReviews() {
  try {
    const pool = await getPool();
    
    if (!pool) {
      throw new Error('Database connection not available');
    }

    // MongoDB pool structure
    if (pool.db) {
      const collection = pool.db.collection(COLLECTION_NAME);
      const reviews = await collection.find({}).sort({ date: -1 }).toArray();
      return reviews;
    }
    
    // PostgreSQL pool structure
    if (pool.query && pool.constructor && pool.constructor.name === 'Pool') {
      const result = await pool.query(
        'SELECT * FROM reviews ORDER BY date DESC'
      );
      return result.rows || [];
    }
    
    // MySQL pool structure (returns array of arrays)
    if (pool.query && pool.execute) {
      const [rows] = await pool.query('SELECT * FROM reviews ORDER BY date DESC');
      return rows || [];
    }

    throw new Error('Unsupported database pool structure');
  } catch (error) {
    logger.error('Error fetching all reviews:', error);
    throw error;
  }
}

/**
 * Get a single review by ID
 * @param {string} reviewId - Review ID
 * @returns {Promise<Object|null>} Review document or null if not found
 */
export async function getReviewById(reviewId) {
  try {
    const pool = await getPool();
    
    if (!pool) {
      throw new Error('Database connection not available');
    }

    // MongoDB pool structure
    if (pool.db) {
      const collection = pool.db.collection(COLLECTION_NAME);
      const review = await collection.findOne({ id: reviewId });
      return review;
    }
    
    // PostgreSQL pool structure
    if (pool.query && pool.constructor && pool.constructor.name === 'Pool') {
      const result = await pool.query(
        'SELECT * FROM reviews WHERE id = $1',
        [reviewId]
      );
      return result.rows?.[0] || null;
    }
    
    // MySQL pool structure
    if (pool.query && pool.execute) {
      const [rows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [reviewId]);
      return rows?.[0] || null;
    }

    throw new Error('Unsupported database pool structure');
  } catch (error) {
    logger.error(`Error fetching review ${reviewId}:`, error);
    throw error;
  }
}

/**
 * Create a new review
 * @param {Object} reviewData - Review data
 * @param {number} reviewData.rating - Rating (1-5)
 * @param {string} [reviewData.comment] - Optional comment
 * @param {string} [reviewData.author] - Optional author name
 * @param {string} [reviewData.photo] - Optional photo URL/base64
 * @param {string} [reviewData.userId] - Optional user identifier for ownership
 * @param {string} [reviewData.id] - Optional ID (for migrations)
 * @param {string} [reviewData.date] - Optional date (for migrations)
 * @returns {Promise<Object>} Created review document
 */
export async function createReview(reviewData) {
  try {
    const pool = await getPool();
    
    if (!pool) {
      throw new Error('Database connection not available');
    }

    const newReview = {
      id: reviewData.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      rating: reviewData.rating,
      comment: reviewData.comment || undefined,
      author: reviewData.author || undefined,
      photo: reviewData.photo || undefined,
      userId: reviewData.userId || undefined,
      date: reviewData.date || new Date().toISOString(),
      verified: reviewData.verified !== undefined ? reviewData.verified : true,
    };

    // MongoDB pool structure
    if (pool.db) {
      const collection = pool.db.collection(COLLECTION_NAME);
      await collection.insertOne(newReview);
      return newReview;
    }
    
    // PostgreSQL pool structure
    if (pool.query && pool.constructor && pool.constructor.name === 'Pool') {
      const result = await pool.query(
        `INSERT INTO reviews (id, rating, comment, author, photo, userId, date, verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          newReview.id,
          newReview.rating,
          newReview.comment,
          newReview.author,
          newReview.photo,
          newReview.userId,
          newReview.date,
          newReview.verified,
        ]
      );
      return result.rows?.[0] || newReview;
    }
    
    // MySQL pool structure
    if (pool.query && pool.execute) {
      await pool.query(
        `INSERT INTO reviews (id, rating, comment, author, photo, userId, date, verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newReview.id,
          newReview.rating,
          newReview.comment,
          newReview.author,
          newReview.photo,
          newReview.userId,
          newReview.date,
          newReview.verified,
        ]
      );
      return newReview;
    }

    throw new Error('Unsupported database pool structure');
  } catch (error) {
    logger.error('Error creating review:', error);
    throw error;
  }
}

/**
 * Delete a review by ID (with ownership verification)
 * @param {string} reviewId - Review ID
 * @param {string} [userId] - User ID to verify ownership (optional, if not provided, allows deletion)
 * @returns {Promise<boolean>} True if deleted, false if not found or not owned by user
 */
export async function deleteReview(reviewId, userId) {
  try {
    const pool = await getPool();
    
    if (!pool) {
      throw new Error('Database connection not available');
    }

    // First, check if review exists and verify ownership if userId is provided
    if (userId) {
      const review = await getReviewById(reviewId);
      if (!review) {
        return false; // Review not found
      }
      
      // Verify ownership
      if (review.userId !== userId) {
        throw new Error('You can only delete your own reviews');
      }
    }

    // MongoDB pool structure
    if (pool.db) {
      const collection = pool.db.collection(COLLECTION_NAME);
      const query = userId 
        ? { id: reviewId, userId: userId } // Only delete if userId matches
        : { id: reviewId }; // Admin deletion (no userId check)
      const result = await collection.deleteOne(query);
      return result.deletedCount > 0;
    }
    
    // PostgreSQL pool structure
    if (pool.query && pool.constructor && pool.constructor.name === 'Pool') {
      const query = userId
        ? 'DELETE FROM reviews WHERE id = $1 AND userId = $2'
        : 'DELETE FROM reviews WHERE id = $1';
      const params = userId ? [reviewId, userId] : [reviewId];
      const result = await pool.query(query, params);
      return result.rowCount > 0;
    }
    
    // MySQL pool structure
    if (pool.query && pool.execute) {
      const query = userId
        ? 'DELETE FROM reviews WHERE id = ? AND userId = ?'
        : 'DELETE FROM reviews WHERE id = ?';
      const params = userId ? [reviewId, userId] : [reviewId];
      const [result] = await pool.query(query, params);
      return result.affectedRows > 0;
    }

    throw new Error('Unsupported database pool structure');
  } catch (error) {
    logger.error(`Error deleting review ${reviewId}:`, error);
    throw error;
  }
}

/**
 * Initialize the reviews collection/table
 * Creates indexes for MongoDB or table for SQL databases
 */
export async function initializeReviewsCollection() {
  try {
    const pool = await getPool();
    
    if (!pool) {
      logger.warn('Database connection not available, skipping collection initialization');
      return;
    }

    // MongoDB pool structure
    if (pool.db) {
      const collection = pool.db.collection(COLLECTION_NAME);
      
      // Create indexes for better query performance
      await collection.createIndex({ id: 1 }, { unique: true });
      await collection.createIndex({ date: -1 });
      await collection.createIndex({ rating: 1 });
      
      logger.info('Reviews collection initialized with indexes');
      return;
    }
    
    // PostgreSQL pool structure
    if (pool.query && pool.constructor && pool.constructor.name === 'Pool') {
      // Create reviews table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id VARCHAR(255) PRIMARY KEY,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          author VARCHAR(255),
          photo TEXT,
          date TIMESTAMP NOT NULL,
          verified BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create indexes
      await pool.query('CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(date DESC)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)');
      
      logger.info('Reviews table initialized (PostgreSQL)');
      return;
    }
    
    // MySQL pool structure
    if (pool.query && pool.execute) {
      // Create reviews table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id VARCHAR(255) PRIMARY KEY,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          author VARCHAR(255),
          photo TEXT,
          userId VARCHAR(255),
          date TIMESTAMP NOT NULL,
          verified BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create indexes
      await pool.query('CREATE INDEX idx_reviews_date ON reviews(date DESC)');
      await pool.query('CREATE INDEX idx_reviews_rating ON reviews(rating)');
      
      logger.info('Reviews table initialized (MySQL)');
      return;
    }

    logger.warn('Unsupported database pool structure, skipping collection initialization');
  } catch (error) {
    logger.error('Error initializing reviews collection:', error);
    // Don't throw - allow server to start even if initialization fails
    // The collection/table might already exist
  }
}
