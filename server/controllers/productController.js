import logger from '../utils/logger.js';
import { parsePagination, createPaginationMeta, validatePagination } from '../utils/pagination.js';
import { PAGINATION } from '../utils/constants.js';

/**
 * GET /api/products
 * Returns a paginated list of products with optional filtering
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.gender] - Filter by gender (men|women|unisex)
 * @param {string} [req.query.brand] - Filter by brand
 * @param {string} [req.query.page] - Page number (default: 1)
 * @param {string} [req.query.limit] - Items per page (default: 24, max: 100)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function getProductList(req, res, next) {
  try {
    // Validate pagination parameters
    const paginationError = validatePagination(req.query, { maxLimit: PAGINATION.MAX_LIMIT });
    if (paginationError) {
      return res.status(400).json(paginationError);
    }

    // Parse pagination with configured limits
    const { page, limit, offset } = parsePagination(req.query, {
      defaultPage: PAGINATION.DEFAULT_PAGE,
      defaultLimit: PAGINATION.DEFAULT_LIMIT,
      maxLimit: PAGINATION.MAX_LIMIT,
    });

    const { gender, brand } = req.query;

    // Stub: no catalog on server yet. Return empty list with correct shape.
    // When scaling: load from DB or shared product service here.
    const products = [];
    const total = 0;

    // Create pagination metadata
    const pagination = createPaginationMeta(page, limit, total);

    res.json({
      success: true,
      products,
      total,
      pagination,
      filters: { gender: gender || null, brand: brand || null },
    });
  } catch (error) {
    logger.error('getProductList error:', error);
    next(error);
  }
}
