import logger from '../utils/logger.js';

/**
 * GET /api/products
 * Query params: gender, brand, page, limit
 * Returns a list of products (stub for now; plug in DB or shared catalog when scaling).
 */
export async function getProductList(req, res, next) {
  try {
    const { gender, brand, page = '1', limit = '24' } = req.query;
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 24));

    // Stub: no catalog on server yet. Return empty list with correct shape.
    // When scaling: load from DB or shared product service here.
    const products = [];
    const total = 0;

    res.json({
      success: true,
      products,
      total,
      page: pageNum,
      limit: limitNum,
      filters: { gender: gender || null, brand: brand || null },
    });
  } catch (error) {
    logger.error('getProductList error:', error);
    next(error);
  }
}
