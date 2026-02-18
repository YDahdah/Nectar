/**
 * Pagination utility for consistent pagination across all endpoints
 * Prevents memory issues from large result sets
 */

/**
 * Parse and validate pagination parameters
 * @param {Object} query - Request query object
 * @param {Object} options - Options
 * @param {number} options.defaultPage - Default page number (default: 1)
 * @param {number} options.defaultLimit - Default page size (default: 20)
 * @param {number} options.maxLimit - Maximum allowed page size (default: 100)
 * @returns {Object} { page, limit, offset }
 */
export function parsePagination(query, options = {}) {
  const {
    defaultPage = 1,
    defaultLimit = 20,
    maxLimit = 100,
  } = options;

  // Parse page
  const page = Math.max(1, parseInt(query.page || defaultPage, 10) || defaultPage);
  
  // Parse limit with max constraint
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(query.limit || defaultLimit, 10) || defaultLimit)
  );
  
  // Calculate offset
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Create pagination metadata for response
 * @param {number} page - Current page
 * @param {number} limit - Page size
 * @param {number} total - Total number of items
 * @returns {Object} Pagination metadata
 */
export function createPaginationMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  };
}

/**
 * Validate pagination parameters and return errors if invalid
 * @param {Object} query - Request query object
 * @param {Object} options - Options (same as parsePagination)
 * @returns {Object|null} Error object or null if valid
 */
export function validatePagination(query, options = {}) {
  const { maxLimit = 100 } = options;
  
  const page = parseInt(query.page, 10);
  const limit = parseInt(query.limit, 10);

  if (query.page && (isNaN(page) || page < 1)) {
    return {
      success: false,
      error: 'Invalid page parameter. Must be a positive integer.',
    };
  }

  if (query.limit && (isNaN(limit) || limit < 1 || limit > maxLimit)) {
    return {
      success: false,
      error: `Invalid limit parameter. Must be between 1 and ${maxLimit}.`,
    };
  }

  return null;
}
