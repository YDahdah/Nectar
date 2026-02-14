import express from 'express';
import { getProductList } from '../controllers/productController.js';

const router = express.Router();

/**
 * GET /api/products
 * Query: gender (men|women|mix), brand, page, limit
 * Returns: { products: [], total: number }
 * Scalable: plug in DB later; frontend can switch to this when USE_PRODUCTS_API is true.
 */
router.get('/', getProductList);

export default router;
