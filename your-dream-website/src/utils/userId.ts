/**
 * User Identifier Utility
 * Generates and stores a unique identifier for the current user
 * This allows users to delete their own reviews
 */

const USER_ID_KEY = 'nectar_user_id';

/**
 * Get or create a unique user identifier
 * @returns {string} Unique user identifier
 */
export function getUserId(): string {
  if (typeof window === 'undefined') {
    // Server-side: return a temporary ID (shouldn't happen in practice)
    return 'temp-' + Date.now();
  }

  let userId = localStorage.getItem(USER_ID_KEY);
  
  if (!userId) {
    // Generate a unique ID: timestamp + random string
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  
  return userId;
}

/**
 * Check if a review belongs to the current user
 * @param {Object} review - Review object
 * @returns {boolean} True if review belongs to current user
 */
export function isOwnReview(review: { userId?: string }): boolean {
  if (!review.userId) {
    // Old reviews without userId cannot be verified, so return false
    // Users can still try to delete, but backend will reject if not admin
    return false;
  }
  const currentUserId = getUserId();
  const isOwn = review.userId === currentUserId;
  
  // Debug logging (remove in production if needed)
  if (process.env.NODE_ENV === 'development') {
    console.log('[isOwnReview]', {
      reviewId: review.userId,
      currentUserId,
      isOwn,
    });
  }
  
  return isOwn;
}
