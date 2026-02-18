import dotenv from "dotenv";
dotenv.config();
import express from "express";
import morgan from "morgan";
import compression from "compression";
import { fileURLToPath } from "url";
import { dirname, join, extname } from "path";
import { existsSync } from "fs";
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
  "http://localhost:3000",
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
  if (!origin) {
    callback(null, true);
    return;
  }
  if (corsOriginValidator(origin)) {
    callback(null, origin);
  } else {
    logger.warn(`CORS blocked origin: ${origin}. Allowed: ${corsOrigins.join(", ")}`);
    callback(null, false);
  }
};

// CORS config: exact origins (no *), credentials true, methods + headers as required
const corsConfig = {
  origin: corsOriginValidatorCallback,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"],
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

// OPTIONS preflight: let cors middleware return 204/200 with CORS headers (do not use * origin)
app.options("*", cors(corsConfig));

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

// Serve static files from frontend dist directory if it exists
// This ensures JavaScript modules are served with correct MIME type
const frontendDistPath = join(__dirname, '../your-dream-website/dist');

if (existsSync(frontendDistPath)) {
  // CRITICAL: Serve static assets with explicit MIME types
  // This must come BEFORE any catch-all routes to prevent SPA fallback from catching JS files
  app.use(express.static(frontendDistPath, {
    setHeaders: (res, filePath) => {
      const ext = extname(filePath).toLowerCase();
      
      // CRITICAL: JavaScript modules MUST use application/javascript
      // This fixes the "Expected a JavaScript-or-Wasm module script" error
      if (ext === '.js' || ext === '.mjs') {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        logger.debug(`✅ Serving JS file: ${filePath}`);
      } else if (ext === '.css') {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (ext === '.json') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      } else if (ext === '.html') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (ext === '.wasm') {
        res.setHeader('Content-Type', 'application/wasm');
      }
    },
    index: false, // Don't serve index.html for directory requests
    // fallthrough: true allows 404 handler to catch missing files
  }));
  
  logger.info(`✅ Static files serving enabled from: ${frontendDistPath}`);
  
  // Debug: Log static file requests
  app.use((req, res, next) => {
    if (req.path.match(/\.(js|mjs|css)$/i)) {
      logger.debug(`📦 Static file request: ${req.path}`);
    }
    next();
  });
} else {
  logger.warn(`⚠️  Frontend dist directory not found at: ${frontendDistPath}`);
}

// MIME type and CDN-friendly headers middleware
// This ensures headers are set even if static middleware doesn't catch the request
app.use((req, res, next) => {
  const path = req.path.toLowerCase();
  
  // CRITICAL FIX: JavaScript modules MUST use application/javascript
  if (path.endsWith('.js') || path.endsWith('.mjs')) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  } else if (path.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
  } else if (path.endsWith('.json')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  } else if (path.endsWith('.html')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
  } else if (path.endsWith('.wasm')) {
    res.setHeader('Content-Type', 'application/wasm');
  } else if (path.match(/\.(woff2|woff|ttf|eot|otf)$/i)) {
    res.setHeader('Content-Type', 'font/woff2');
  }
  
  // Add CDN cache control headers
  if (req.path.startsWith('/api/')) {
    res.setHeader('CDN-Cache-Control', 'public, max-age=300, s-maxage=300');
  } else if (req.path.match(/\.(js|mjs|css|woff2|woff|ttf|eot|jpg|jpeg|png|gif|webp|svg|ico|wasm)$/i)) {
    res.setHeader('CDN-Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
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

// SPA fallback - serve index.html for non-API routes (must be AFTER API routes and static files)
// CRITICAL: This must use app.use() not app.get() to catch all HTTP methods
// But it must check for static assets FIRST
app.use((req, res, next) => {
  // CRITICAL: Skip ALL static asset requests - they should be handled by express.static above
  // If we reach here for a static asset, it means express.static didn't find it - return 404
  const isStaticAsset = req.path.match(/\.(js|mjs|css|json|woff2|woff|ttf|eot|otf|jpg|jpeg|png|gif|webp|svg|ico|wasm|map)$/i);
  if (isStaticAsset) {
    // Static file not found - return 404 (don't serve index.html)
    // Log for debugging
    logger.error(`❌ Static file requested but not found: ${req.path} - This should have been handled by express.static`);
    return res.status(404).json({ 
      error: 'File not found',
      path: req.path,
      message: 'Static file not found. Check server logs for details.'
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
  
  // Only serve index.html for actual routes (not files)
  if (existsSync(frontendDistPath)) {
    const indexPath = join(frontendDistPath, 'index.html');
    res.sendFile(indexPath, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }, (err) => {
      if (err) {
        logger.error('Error serving index.html:', err);
        next();
      }
    });
  } else {
    next();
  }
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
