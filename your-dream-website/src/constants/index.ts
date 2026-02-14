/**
 * App-wide constants for scalability and easy tuning.
 * Change these when you need to scale (e.g. more products per page, different limits).
 */

/** Number of products to show per page on the Shop page before "Load more". */
export const SHOP_PAGE_SIZE = 24;

/** Initial number of products to show (first page). Same as SHOP_PAGE_SIZE for consistency. */
export const SHOP_INITIAL_PAGE_SIZE = SHOP_PAGE_SIZE;

/** Max number of featured products on the homepage. */
export const FEATURED_PRODUCTS_LIMIT = 8;

/** Max number of related products on a product detail page. */
export const RELATED_PRODUCTS_LIMIT = 2;

/**
 * When true, product list will be fetched from GET /api/products (backend).
 * When false, uses in-memory catalog (current behavior).
 * Flip to true after implementing products API and DB.
 */
export const USE_PRODUCTS_API = false;
