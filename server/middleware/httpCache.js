import crypto from "crypto";
import logger from "../utils/logger.js";

/**
 * HTTP Cache Headers Middleware
 * Adds ETag, Cache-Control, and Last-Modified headers for better CDN and browser caching
 * 
 * Usage:
 *   app.get('/api/products', httpCacheMiddleware({ maxAge: 300 }), productController.getProducts);
 * 
 * @param {Object} options - Cache options
 * @param {number} options.maxAge - Max age in seconds (default: 300 = 5 minutes)
 * @param {boolean} options.private - If true, sets Cache-Control: private (default: false)
 * @param {boolean} options.mustRevalidate - If true, adds must-revalidate (default: true)
 * @param {boolean} options.etag - Enable ETag generation (default: true)
 * @returns {Function} Express middleware
 */
export function httpCacheMiddleware(options = {}) {
  const {
    maxAge = 300, // 5 minutes default
    private: isPrivate = false,
    mustRevalidate = true,
    etag = true,
  } = options;

  return (req, res, next) => {
    // Only apply to GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Build Cache-Control header
    const cacheControl = [];
    if (isPrivate) {
      cacheControl.push("private");
    } else {
      cacheControl.push("public");
    }
    cacheControl.push(`max-age=${maxAge}`);
    if (mustRevalidate) {
      cacheControl.push("must-revalidate");
    }
    cacheControl.push("stale-while-revalidate=60"); // Allow stale content for 60s while revalidating

    res.setHeader("Cache-Control", cacheControl.join(", "));

    // Set Vary header for content negotiation
    res.setHeader("Vary", "Accept, Accept-Encoding");

    // Store original json method to generate ETag
    if (etag) {
      const originalJson = res.json.bind(res);
      const originalEnd = res.end.bind(res);

      // Override json method to generate ETag
      res.json = function (data) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const body = JSON.stringify(data);
          const etagValue = generateETag(body);
          res.setHeader("ETag", etagValue);

          // Check if client has matching ETag (304 Not Modified)
          const clientETag = req.headers["if-none-match"];
          if (clientETag === etagValue) {
            res.status(304);
            res.removeHeader("Content-Type");
            res.removeHeader("Content-Length");
            return res.end();
          }
        }
        return originalJson(data);
      };

      // Override end method for non-JSON responses
      res.end = function (chunk, encoding) {
        if (res.statusCode >= 200 && res.statusCode < 300 && chunk) {
          const body = chunk.toString();
          const etagValue = generateETag(body);
          res.setHeader("ETag", etagValue);

          const clientETag = req.headers["if-none-match"];
          if (clientETag === etagValue) {
            res.status(304);
            res.removeHeader("Content-Type");
            res.removeHeader("Content-Length");
            return res.end();
          }
        }
        return originalEnd(chunk, encoding);
      };
    }

    // Set Last-Modified header (current time for dynamic content)
    res.setHeader("Last-Modified", new Date().toUTCString());

    next();
  };
}

/**
 * Generate ETag from content
 */
function generateETag(content) {
  const hash = crypto.createHash("md5").update(content).digest("hex");
  return `"${hash}"`;
}

/**
 * Cache middleware for static-like content (longer cache)
 * Use for content that changes infrequently
 */
export function longCacheMiddleware(maxAge = 3600) {
  return httpCacheMiddleware({
    maxAge,
    private: false,
    mustRevalidate: false,
    etag: true,
  });
}

/**
 * Cache middleware for private/user-specific content
 * Use for authenticated endpoints
 */
export function privateCacheMiddleware(maxAge = 60) {
  return httpCacheMiddleware({
    maxAge,
    private: true,
    mustRevalidate: true,
    etag: true,
  });
}

/**
 * No-cache middleware for dynamic content
 * Use for endpoints that should always fetch fresh data
 */
export function noCacheMiddleware() {
  return (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  };
}

export default httpCacheMiddleware;
