/**
 * Express static file serving configuration
 * Use this if serving frontend files directly from Express instead of nginx
 * 
 * Usage:
 *   import express from 'express';
 *   import { configureStaticFiles } from './express-static-config.js';
 *   const app = express();
 *   configureStaticFiles(app, path.join(__dirname, '../your-dream-website/dist'));
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configure static file serving with proper MIME types
 * @param {express.Application} app - Express app instance
 * @param {string} staticDir - Directory containing static files (default: dist)
 */
export function configureStaticFiles(app, staticDir = null) {
  const distPath = staticDir || path.join(__dirname, '../your-dream-website/dist');

  // CRITICAL: Serve static assets with proper MIME types
  // This MUST come before any catch-all routes
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      
      // Set proper Content-Type for JavaScript modules
      if (ext === '.js' || ext === '.mjs') {
        res.set('Content-Type', 'application/javascript; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // CSS files
      else if (ext === '.css') {
        res.set('Content-Type', 'text/css; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // JSON files
      else if (ext === '.json') {
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=3600');
      }
      // HTML files
      else if (ext === '.html') {
        res.set('Content-Type', 'text/html; charset=utf-8');
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
      // Font files
      else if (['.woff2', '.woff', '.ttf', '.eot', '.otf'].includes(ext)) {
        res.set('Content-Type', ext === '.woff2' ? 'font/woff2' : 'font/woff');
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // Images
      else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'].includes(ext)) {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
    // Don't serve index.html for asset requests
    index: false,
  }));

  // CRITICAL: SPA fallback - serve index.html for routes
  // This MUST come AFTER static file serving
  app.get('*', (req, res, next) => {
    // Skip if this is an asset request (already handled by static middleware)
    if (req.path.match(/\.(js|mjs|css|json|woff2|woff|ttf|eot|otf|jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
      return next(); // Let 404 handler catch it
    }
    
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    // Serve index.html for SPA routes
    res.sendFile(path.join(distPath, 'index.html'), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  });
}

export default configureStaticFiles;
