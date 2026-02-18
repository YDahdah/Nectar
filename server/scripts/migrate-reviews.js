/**
 * Migration script to migrate reviews from JSON file to database
 * Run this once after setting up the database to migrate existing reviews
 * 
 * Usage: node server/scripts/migrate-reviews.js
 */

import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import * as reviewModel from '../models/reviewModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REVIEWS_FILE = path.join(__dirname, '../../data/reviews.json');

async function migrateReviews() {
  try {
    logger.info('Starting reviews migration...');
    
    // Initialize database collection/table
    await reviewModel.initializeReviewsCollection();
    logger.info('Database collection initialized');
    
    // Check if JSON file exists
    let existingReviews = [];
    try {
      const data = await fs.readFile(REVIEWS_FILE, 'utf-8');
      existingReviews = JSON.parse(data);
      logger.info(`Found ${existingReviews.length} reviews in JSON file`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.info('No existing reviews.json file found. Nothing to migrate.');
        return;
      }
      throw error;
    }
    
    if (existingReviews.length === 0) {
      logger.info('No reviews to migrate.');
      return;
    }
    
    // Check if reviews already exist in database
    const dbReviews = await reviewModel.getAllReviews();
    if (dbReviews.length > 0) {
      logger.warn(`Database already contains ${dbReviews.length} reviews.`);
      logger.warn('Skipping migration to avoid duplicates.');
      logger.warn('If you want to migrate anyway, delete existing reviews from the database first.');
      return;
    }
    
    // Migrate each review
    let migrated = 0;
    let failed = 0;
    
    for (const review of existingReviews) {
      try {
        // Ensure review has required fields
        if (!review.id || !review.rating || !review.date) {
          logger.warn(`Skipping invalid review: ${JSON.stringify(review)}`);
          failed++;
          continue;
        }
        
        // Create review in database (preserve original ID and date)
        await reviewModel.createReview({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          author: review.author,
          photo: review.photo,
          date: review.date,
          verified: review.verified !== undefined ? review.verified : true,
        });
        
        migrated++;
      } catch (error) {
        logger.error(`Failed to migrate review ${review.id}:`, error.message);
        failed++;
      }
    }
    
    logger.info(`Migration complete! Migrated: ${migrated}, Failed: ${failed}`);
    
    if (migrated > 0) {
      logger.info('Consider backing up or removing the old reviews.json file after verifying the migration.');
    }
    
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateReviews()
  .then(() => {
    logger.info('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration script error:', error);
    process.exit(1);
  });
