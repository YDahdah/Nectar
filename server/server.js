import dotenv from "dotenv";
dotenv.config();
import express from "express";
import morgan from "morgan";
import compression from "compression";
import { fileURLToPath } from "url";
import { dirname, join, extname, resolve } from "path";
import { existsSync, readdirSync } from "fs";
import mime from "mime";
import config from "./config/config.js";
import logger from "./utils/logger.js";
import {
  
  helmetMiddleware,
  rateLimiter,
  requestSizeLimit,
} from "./middleware/security.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import performanceMiddleware, { getMetrics } from "./middleware/performance.js";
import prometheusMiddleware, { prometheusMetricsHandler } from "./middleware/prometheus.js";

// Import routes
import orderRoutes from "./routes/orderRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cors from "cors";

const app = express();

// Trust proxy (important for rate limiting and IP detection)
app.set("trust proxy", 1);

// CORS origins configuration (defined early for use in OPTIONS handler)
// Use config which supports environment variables via CORS_ORIGINS
const corsOrigins = config.security.corsOrigins || [
  "https://perfumenectar.com",
  "https://www.perfumenectar.com",
  "http://localhost:5173",
];

// CORS origin validation function
// Checks against all allowed origins from config
const corsOriginValidator = (origin) => {
  if (!origin) return false; // Require origin header for browser requests
  
  const normalizedOrigin = origin.replace(/\/$/, "").toLowerCase();
  
  // Check against all allowed origins
  return corsOrigins.some(allowedOrigin => {
    const normalizedAllowed = allowedOrigin.replace(/\/$/, "").toLowerCase();
    return normalizedOrigin === normalizedAllowed;
  });
};

// CORS origin validation for cors middleware (callback-based)
// When credentials: true we MUST return exact origin (not *)
const corsOriginValidatorCallback = (origin, callback) => {
  // Always log CORS validation attempts for debugging
  logger.info(`CORS check: origin=${origin || 'none'}, allowed=${corsOrigins.join(', ')}`);
  
  if (!origin) {
    // For non-browser requests (like curl, Postman), allow but don't set CORS headers
    callback(null, true);
    return;
  }
  
  if (corsOriginValidator(origin)) {
    logger.info(`✅ CORS allowed: ${origin}`);
    callback(null, origin);
  } else {
    logger.warn(`❌ CORS blocked origin: ${origin}. Allowed origins: ${corsOrigins.join(", ")}`);
    callback(new Error(`CORS: Origin ${origin} not allowed`), false);
  }
};

// CORS config: exact origins (no *), credentials true, methods + headers as required
const corsConfig = {
  origin: corsOriginValidatorCallback,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"],
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

// OPTIONS preflight: let cors middleware return 204/200 with CORS headers (do not use * origin)
// CRITICAL: This must handle OPTIONS requests BEFORE other middleware
app.options("*", (req, res, next) => {
  const origin = req.headers.origin;
  logger.info(`OPTIONS preflight request from origin: ${origin || 'none'}`);
  
  // Use cors middleware to handle OPTIONS
  cors(corsConfig)(req, res, next);
});

// Helper function to add CORS headers to responses
const addCorsToResponse = (req, res) => {
  const origin = req.headers.origin;
  if (origin && corsOriginValidator(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
};

// Health check endpoints - must be before middleware to respond immediately
// Cloud Run uses these for health checks
app.get("/health", async (req, res) => {
  addCorsToResponse(req, res);
  
  const health = {
    status: "ok",
    message: "API is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  };

  // Optional: Check database connection
  if (process.env.HEALTH_CHECK_DB === "true") {
    try {
      const { getPool } = await import("./utils/db-pool.js");
      const pool = await getPool();
      if (pool) {
        await pool.query("SELECT 1");
        health.database = "connected";
      }
    } catch (error) {
      health.database = "disconnected";
      health.status = "degraded";
      return res.status(503).json(health);
    }
  }

  // Optional: Check Redis connection
  if (process.env.HEALTH_CHECK_REDIS === "true") {
    try {
      const { redisClient, redisAvailable } = await import("./middleware/cache.js");
      if (redisAvailable && redisClient) {
        await redisClient.ping();
        health.redis = "connected";
      } else {
        health.redis = "unavailable";
      }
    } catch (error) {
      health.redis = "disconnected";
      health.status = "degraded";
    }
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  res.status(statusCode).json(health);
});

// Root path - respond immediately for Cloud Run health checks
// Cloud Run may check the root path, so we handle it before middleware
app.get("/", (req, res) => {
  addCorsToResponse(req, res);
  res.status(200).json({
    success: true,
    message: "Nectar API Server",
    version: "2.0.0",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Log CORS origins on startup
logger.info("🌐 CORS allowed origins: " + corsOrigins.join(", "));

// CORS middleware - handles CORS for all non-OPTIONS requests
// OPTIONS requests are already handled above
// This middleware adds CORS headers to all responses (success and error)
// CRITICAL: Must be before other middleware to ensure headers are set
app.use(cors(corsConfig));

// Security middleware
app.use(helmetMiddleware);
// Compression middleware - compress responses to reduce bandwidth
app.use(compression({
  filter: (req, res) => {
    // Don't compress responses if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Don't compress already compressed content
    if (req.url.match(/\.(jpg|jpeg|png|gif|webp|svg|woff2|woff|ttf|eot|zip|gz)$/i)) {
      return false;
    }
    // Use compression for all other responses
    return compression.filter(req, res);
  },
  level: 6, // Compression level (1-9, 6 is a good balance)
  threshold: 1024, // Only compress responses larger than 1KB
  // Use Brotli if available (better compression than gzip)
  brotli: true,
}));

// CRITICAL FIX: Serve static files with proper MIME types for ES modules
// This MUST come before API routes and SPA fallback to handle static asset requests
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Frontend static files: local/monolith only. Render + Firebase = API-only (NODE_ENV=production
// disables static). Override with SERVE_STATIC_FRONTEND=true|false|0.
const frontendDistPath = join(__dirname, '../your-dream-website/dist');
const distExists = existsSync(frontendDistPath);
const staticEnv = process.env.SERVE_STATIC_FRONTEND?.toLowerCase();
const serveStaticFrontend =
  staticEnv === "true"
    ? distExists
    : staticEnv === "false" || staticEnv === "0"
      ? false
      : config.nodeEnv !== "production" && distExists;

if (serveStaticFrontend) {
  logger.info(`✅ Serving frontend static files from: ${frontendDistPath}`);
} else {
  if (staticEnv === "true" && !distExists) {
    logger.warn(
      `SERVE_STATIC_FRONTEND=true but no dist at ${frontendDistPath} — static files not served`,
    );
  } else if (config.nodeEnv === "production") {
    logger.info(
      "📡 API-only mode: static frontend disabled in production (e.g. Render backend + Firebase hosting).",
    );
  } else if (!distExists) {
    logger.info(
      `📡 No frontend build at ${frontendDistPath} — running API only.`,
    );
  } else {
    logger.info("📡 Static frontend disabled (SERVE_STATIC_FRONTEND=false). API only.");
  }
}

// Fix common wrong MIME types for module assets
mime.define(
  {
    'application/javascript': ['js', 'mjs'],
    'application/wasm': ['wasm'],
    'text/css': ['css'],
  },
  { force: true }
);

// CRITICAL: Explicitly handle /assets/* paths FIRST - NEVER rewrite to index.html
// This ensures /assets/*.js files are served with correct MIME type and never fall through to SPA
if (serveStaticFrontend) {
  app.use('/assets', (req, res, next) => {
    const filePath = join(frontendDistPath, req.path);
    
    if (existsSync(filePath)) {
      const ext = extname(filePath).toLowerCase();
      
      // Set correct MIME types - CRITICAL for JS modules
      if (ext === '.js' || ext === '.mjs') {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        logger.info(`✅ Serving /assets JS: ${req.path} with Content-Type: application/javascript`);
      } else if (ext === '.css') {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (ext === '.wasm') {
        res.setHeader('Content-Type', 'application/wasm');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      
      return res.sendFile(resolve(filePath));
    }
    
    // File doesn't exist - return 404 JSON, NEVER HTML
    logger.error(`❌ Asset not found: ${req.path}`);
    res.status(404);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.json({ error: 'Asset not found', path: req.path });
  });
}

if (serveStaticFrontend) {
  // CRITICAL: Serve static assets FIRST with explicit MIME types
  // This MUST come BEFORE any other routes to prevent SPA fallback from catching JS files
  app.use(express.static(frontendDistPath, {
    setHeaders: (res, filePath) => {
      const ext = extname(filePath).toLowerCase();
      
      // CRITICAL: JavaScript modules MUST use application/javascript
      // This fixes "Failed to load module script" and "Unexpected token '<'" errors
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        logger.info(`✅ Serving JS file: ${filePath} with Content-Type: application/javascript`);
      } else if (filePath.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
    index: false, // CRITICAL: Don't serve index.html for directory requests
    fallthrough: true, // CRITICAL: Allow fallthrough so blocker middleware can catch missing files
    dotfiles: 'ignore',
    redirect: false,
  }));
  
  // Log available files for debugging
  try {
    const assetsPath = join(frontendDistPath, 'assets');
    if (existsSync(assetsPath)) {
      const files = readdirSync(assetsPath);
      const jsFiles = files.filter(f => f.endsWith('.js'));
      logger.info(`📦 Found ${jsFiles.length} JS files in assets folder`);
      if (jsFiles.length > 0) {
        logger.info(`   Example: ${jsFiles[0]}`);
      }
    }
  } catch (err) {
    logger.debug('Could not list assets directory:', err.message);
  }
}

// MIME type middleware - runs AFTER static file serving
// This ensures headers are set correctly even if express.static doesn't catch it
app.use((req, res, next) => {
  const path = req.path.toLowerCase();

  if (serveStaticFrontend) {
    // CRITICAL FIX: JavaScript modules MUST use application/javascript
    // Only set if not already set by express.static
    if ((path.endsWith('.js') || path.endsWith('.mjs')) && !res.getHeader('Content-Type')) {
      res.type('application/javascript');
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      logger.warn(`⚠️  JS file MIME type set by middleware (not by express.static): ${req.path}`);
    } else if (path.endsWith('.css') && !res.getHeader('Content-Type')) {
      res.type('text/css');
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (path.endsWith('.json') && !res.getHeader('Content-Type')) {
      res.type('application/json');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    } else if (path.endsWith('.html') && !res.getHeader('Content-Type')) {
      res.type('text/html');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    } else if (path.endsWith('.wasm') && !res.getHeader('Content-Type')) {
      res.type('application/wasm');
      res.setHeader('Content-Type', 'application/wasm');
    } else if (path.match(/\.(woff2|woff|ttf|eot|otf)$/i) && !res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'font/woff2');
    }
  }

  // Add CDN cache control headers.
  // Order endpoints are transactional and must NEVER be cached by browsers or CDNs —
  // otherwise stale informational responses (or, worse, a stale 4xx) get pinned for
  // up to 5 minutes after a deploy.
  if (req.path.startsWith('/api/orders')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('CDN-Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else if (req.path.startsWith('/api/')) {
    res.setHeader('CDN-Cache-Control', 'public, max-age=300, s-maxage=300');
  } else if (
    serveStaticFrontend &&
    req.path.match(/\.(js|mjs|css|woff2|woff|ttf|eot|jpg|jpeg|png|gif|webp|svg|ico|wasm)$/i)
  ) {
    res.setHeader('CDN-Cache-Control', 'public, max-age=31536000, immutable');
    if (!res.getHeader('Cache-Control')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
  
  // Add timing headers for performance monitoring
  res.setHeader('X-Request-ID', req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  next();
});
app.use(rateLimiter);
app.use(requestSizeLimit("10mb"));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    }),
  );
}

// Additional API information endpoint
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Nectar API Server",
    version: "2.0.0",
    endpoints: {
      health: "/health",
      apiHealth: "/api/health",
      emailHealth: "/api/health/email",
      orders: "/api/orders",
      products: "/api/products",
      newsletter: "/api/newsletter",
      test: "/api/test",
      email: "/api/send-email",
      emailTest: "/api/test-email-config",
    },
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API health check endpoint (for monitoring/proxies)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API is running",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Diagnostic route: visit /api/health/email in a browser to verify the
// email configuration WITHOUT sending any real email.
//
// Guarantees:
//   - Never sends a real email (uses transporter.verify() only).
//   - Never hangs (8s hard cap on SMTP verify).
//   - Never throws / 5xx — always returns HTTP 200 with a structured JSON body
//     so a broken email setup can't crash the route or trigger Render's
//     "502 Bad Gateway" upstream timeout.
app.get("/api/health/email", async (req, res) => {
  try {
    const { verifyEmailConfig } = await import("./services/emailService.js");
    const result = await verifyEmailConfig({ timeoutMs: 8000 });
    return res.status(200).json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[health/email] Unexpected exception:", err?.message);
    return res.status(200).json({
      success: false,
      emailConfigured: false,
      error: "Email check failed",
      details: err?.message,
      env: {
        EMAIL_USER: process.env.EMAIL_USER ? "SET" : "MISSING",
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? "SET" : "MISSING",
        OWNER_EMAIL: process.env.OWNER_EMAIL ? "SET" : "MISSING",
        ORDER_EMAIL: process.env.ORDER_EMAIL ? "SET" : "MISSING",
        NODE_ENV: process.env.NODE_ENV || "unset",
      },
    });
  }
});

// Performance monitoring middleware (after security, before routes)
app.use(performanceMiddleware);

// Prometheus metrics middleware
app.use(prometheusMiddleware);

// Additional health check endpoint with more details (after middleware)
app.get("/health/detailed", (req, res) => {
  res.json({
    status: "ok",
    message: "API is running",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Metrics endpoint for monitoring (JSON format)
app.get("/metrics", (req, res) => {
  // Optional: Add authentication for metrics endpoint in production
  if (process.env.NODE_ENV === "production" && req.headers["x-api-key"] !== process.env.METRICS_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json(getMetrics());
});

// Prometheus metrics endpoint (Prometheus format)
app.get("/metrics/prometheus", (req, res) => {
  // Optional: Add authentication for metrics endpoint in production
  if (process.env.NODE_ENV === "production" && req.headers["x-api-key"] !== process.env.METRICS_API_KEY) {
    return res.status(401).send("# Unauthorized\n");
  }
  prometheusMetricsHandler(req, res);
});

// API routes
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/test", testRoutes);
app.use("/api", emailRoutes);

// Prevent direct access to TypeScript source files
app.use((req, res, next) => {
  if (req.url && req.url.endsWith(".ts") && !req.url.includes("node_modules")) {
    return res.status(404).json({ error: "Not found" });
  }
  next();
});

// Block static-asset paths from reaching SPA fallback (404 JSON, never index.html)
app.use((req, res, next) => {
  const isStaticAsset = req.path.match(/\.(js|mjs|css|json|woff2|woff|ttf|eot|otf|jpg|jpeg|png|gif|webp|svg|ico|wasm|map)$/i);
  if (!isStaticAsset) {
    return next();
  }

  if (!serveStaticFrontend) {
    res.status(404);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.json({
      error: "Not found",
      message: "This host only serves the API. Static assets are hosted with the frontend.",
    });
  }

  const filePath = join(frontendDistPath, req.path);

  if (existsSync(filePath)) {
    logger.warn(`⚠️ File exists but express.static didn't serve it: ${req.path}`);
    const ext = extname(filePath).toLowerCase();
    if (ext === ".js" || ext === ".mjs") {
      res.type("application/javascript");
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    }
    return res.sendFile(resolve(filePath));
  }

  logger.warn(`Static file not found: ${req.path} (dist: ${frontendDistPath})`);
  res.status(404);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.json({
    error: "File not found",
    path: req.path,
    message: "Static file not found.",
  });
});

// SPA fallback — only when this process serves the Vite build (local / monolith)
app.use((req, res, next) => {
  if (!serveStaticFrontend) {
    return next();
  }

  // TRIPLE-CHECK: NEVER serve index.html for static assets (absolute safety)
  const isStaticAsset = req.path.match(/\.(js|mjs|css|json|woff2|woff|ttf|eot|otf|jpg|jpeg|png|gif|webp|svg|ico|wasm|map)$/i);
  if (isStaticAsset) {
    logger.error(`❌ CRITICAL ERROR: SPA fallback caught static asset: ${req.path}`);
    logger.error(`   This should be IMPOSSIBLE - blocker middleware should have caught this!`);
    logger.error(`   Request URL: ${req.url}`);
    logger.error(`   Request path: ${req.path}`);
    // Return 500 error, NOT HTML
    res.status(500);
    res.type('application/json');
    return res.json({ 
      error: 'Server configuration error',
      message: 'Static asset request reached SPA fallback - this should never happen'
    });
  }
  
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  // Skip health/metrics endpoints
  if (req.path === '/health' || req.path === '/health/detailed' || req.path.startsWith('/metrics')) {
    return next();
  }
  
  // Skip if path looks like a file (extra safety)
  // This is critical - if path has an extension, it's a file request, not a route
  if (req.path.includes('.')) {
    const ext = req.path.split('.').pop()?.toLowerCase();
    // If it's a known file extension, this should have been caught by static middleware
    if (['js', 'mjs', 'css', 'json', 'woff2', 'woff', 'ttf', 'eot', 'otf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'wasm', 'map'].includes(ext || '')) {
      logger.error(`❌ CRITICAL: SPA fallback caught file request: ${req.path}`);
      logger.error(`   This should be IMPOSSIBLE - static middleware should have caught this!`);
      res.status(404);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.json({ 
        error: 'File not found',
        path: req.path,
        message: 'File request reached SPA fallback - this should never happen'
      });
    }
    logger.warn(`⚠️  SPA fallback: Path contains dot but wasn't caught by static asset check: ${req.path}`);
    return next(); // Let 404 handler catch it
  }
  
  const indexPath = join(frontendDistPath, "index.html");
  if (!existsSync(indexPath)) {
    return next();
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  res.sendFile(indexPath, (err) => {
    if (err) {
      logger.error("Error serving index.html:", err);
      next();
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;

// Start server if running directly
const startServer = (port) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
      logger.info(`📍 Health check: http://localhost:${port}/health`);
      logger.info(`📍 API info: http://localhost:${port}/api`);
      logger.info(`Environment: ${config.nodeEnv}`);
      resolve(server);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        reject(new Error(`Port ${port} is already in use`));
      } else {
        logger.error("❌ Server error:", error);
        reject(error);
      }
    });
  });
};

const basePort = parseInt(process.env.PORT || "3000", 10);
let currentPort = basePort;
const maxAttempts = 10;

const tryStartServer = async () => {

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const server = await startServer(currentPort);
      
      // Graceful shutdown handlers
      process.on("SIGTERM", () => {
        logger.info("SIGTERM received, shutting down...");
        server.close(() => process.exit(0));
      });

      process.on("SIGINT", () => {
        logger.info("SIGINT received, shutting down...");
        server.close(() => process.exit(0));
      });
      
      return; // Successfully started
    } catch (error) {
      if (error.message.includes("already in use")) {
        if (attempt === 0 && currentPort === basePort) {
          logger.warn(`⚠️  Port ${currentPort} is already in use. Trying alternative ports...`);
        }
        currentPort = basePort + attempt + 1;
        logger.info(`   Trying port ${currentPort}...`);
      } else {
        logger.error("❌ Failed to start server:", error);
        process.exit(1);
      }
    }
  }
  
  logger.error(`❌ Could not find an available port after ${maxAttempts} attempts (tried ports ${basePort}-${currentPort})`);
  logger.error(`   Please stop the process using port ${basePort} or set a different PORT environment variable`);
  process.exit(1);
};

tryStartServer().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});

// // Check if this file is being run directly
// const __filename = fileURLToPath(import.meta.url);

// // Check if we're running in Cloud Run environment
// const isCloudRun = !!process.env.K_SERVICE;
// const isCloudEnvironment = isCloudRun;

// // Normalize paths for comparison (handle Windows backslashes)
// const normalizePath = (path) => path?.replace(/\\/g, "/").toLowerCase();
// const mainModulePath = normalizePath(process.argv[1]);
// const currentFilePath = normalizePath(__filename);

// // Check if this is the main module being executed
// // IMPORTANT: Never start server if we're in Cloud Run environment
// const isMainModule =
//   !isCloudEnvironment &&
//   mainModulePath &&
//   (mainModulePath.endsWith("server.js") ||
//     mainModulePath === currentFilePath ||
//     mainModulePath.includes("server.js"));

// // Log for debugging
// logger.info(
//   `Main module check: mainPath=${mainModulePath}, currentPath=${currentFilePath}, isMain=${isMainModule}, isCloudEnv=${isCloudEnvironment}`,
// );

// if (isMainModule) {
//   const startServer = async (port) => {
//     return new Promise((resolve, reject) => {
//       const server = app.listen(port, () => {
//         logger.info(`🚀 Server running on port ${port}`);
//         logger.info(`📍 Health check: http://localhost:${port}/health`);
//         logger.info(`📍 API info: http://localhost:${port}/api`);
//         logger.info(`Environment: ${config.nodeEnv}`);
//         resolve(server);
//       });

//       server.on("error", (error) => {
//         if (error.code === "EADDRINUSE") {
//           reject(error);
//         } else {
//           logger.error("❌ Server error:", error);
//           reject(error);
//         }
//       });
//     });
//   };

//   const tryStartServer = async () => {
//     const basePort = config.port || 3000;
//     let port = basePort;
//     let attempts = 0;
//     const maxAttempts = 10;

//     while (attempts < maxAttempts) {
//       try {
//         logger.info(`Attempting to start server on port ${port}...`);
//         const server = await startServer(port);

//         // Handle graceful shutdown
//         const shutdown = (signal) => {
//           logger.info(`${signal} signal received: closing HTTP server`);
//           server.close(() => {
//             logger.info("HTTP server closed");
//             process.exit(0);
//           });
//         };

//         process.on("SIGTERM", () => shutdown("SIGTERM"));
//         process.on("SIGINT", () => shutdown("SIGINT"));

//         return; // Successfully started
//       } catch (error) {
//         if (error.code === "EADDRINUSE") {
//           attempts++;
//           port = basePort + attempts;
//           logger.warn(`Port ${port - 1} is in use, trying port ${port}...`);
//         } else {
//           logger.error("Failed to start server:", error);
//           process.exit(1);
//         }
//       }
//     }

//     logger.error(
//       `❌ Could not find an available port after ${maxAttempts} attempts.`,
//     );
//     process.exit(1);
//   };

//   tryStartServer().catch((error) => {
//     logger.error("Failed to start server:", error);
//     process.exit(1);
//   });
// } else {
//   if (isCloudEnvironment) {
//     logger.info("Server not started - running in Cloud Run environment");
//   } else {
//     logger.info("Server not started - imported as module");
//   }
// }
