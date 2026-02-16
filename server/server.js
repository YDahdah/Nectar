import dotenv from "dotenv";
dotenv.config();
import express from "express";
import morgan from "morgan";
import compression from "compression";
import { fileURLToPath } from "url";
import { dirname } from "path";
import config from "./config/config.js";
import logger from "./utils/logger.js";
import {
  
  helmetMiddleware,
  rateLimiter,
  requestSizeLimit,
} from "./middleware/security.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import performanceMiddleware, { getMetrics } from "./middleware/performance.js";

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
// Only allow requests from the production frontend
const corsOrigins = [
  "https://perfumenectar.com",
];

// CORS origin validation function
// Only allows exact match for https://perfumenectar.com
const corsOriginValidator = (origin) => {
  if (!origin) return false; // Require origin header for browser requests
  
  const normalizedOrigin = origin.replace(/\/$/, "").toLowerCase();
  const normalizedAllowed = corsOrigins[0].replace(/\/$/, "").toLowerCase();
  
  // Exact match only - no www variants or other domains
  return normalizedOrigin === normalizedAllowed;
};

// Handle OPTIONS preflight requests FIRST - before any other middleware
// This ensures CORS preflight requests always get proper headers
// CRITICAL: Must return exact origin (not *) when credentials: true
// This MUST be before any middleware to catch OPTIONS requests immediately
app.options("*", (req, res) => {
  const origin = req.headers.origin;
  
  // Log preflight request for debugging
  logger.info(`OPTIONS preflight request: ${req.path} from origin: ${origin || 'none'}`);
  
  // If no origin, allow but don't set CORS headers (non-browser request)
  if (!origin) {
    res.status(204).end();
    return;
  }
  
  // Validate origin
  if (corsOriginValidator(origin)) {
    // CRITICAL: Set exact origin (required when credentials: true)
    // Browser will reject if we use * while credentials: true
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "86400");
    logger.info(`✅ OPTIONS preflight allowed for origin: ${origin}`);
    res.status(204).end();
  } else {
    // Origin not allowed - don't set CORS headers, browser will block
    logger.warn(`⚠️  CORS preflight blocked for origin: ${origin}`);
    logger.warn(`   Allowed origins: ${corsOrigins.join(", ")}`);
    res.status(403).end();
  }
});

// Health check endpoints - must be before middleware to respond immediately
// Cloud Run uses these for health checks
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// Root path - respond immediately for Cloud Run health checks
// Cloud Run may check the root path, so we handle it before middleware
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Nectar API Server",
    version: "2.0.0",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Log CORS origins on startup
console.log("🌐 CORS allowed origins:", corsOrigins);

// CORS origin validation function for cors middleware (callback-based)
// CRITICAL: When credentials: true, we MUST return exact origin (not *)
const corsOriginValidatorCallback = (origin, callback) => {
  if (!origin) {
    // No origin header (non-browser request) - allow but don't set CORS headers
    callback(null, true);
    return;
  }

  if (corsOriginValidator(origin)) {
    // Return the EXACT origin (required when credentials: true)
    // Browser will reject if we return * while credentials: true
    console.log(`✅ CORS allowed origin: ${origin}`);
    callback(null, origin); // Return exact origin, not true
  } else {
    console.warn(`⚠️  CORS blocked origin: ${origin}`);
    console.warn(`   Allowed origins: ${corsOrigins.join(", ")}`);
    callback(null, false);
  }
};

// CORS configuration object (reusable)
// IMPORTANT: origin must return exact origin string (not true/*) when credentials: true
// This configuration ensures:
// 1. OPTIONS preflight requests get proper headers
// 2. Exact origin is returned (not *) when credentials: true
// 3. All routes get CORS headers including error responses
const corsConfig = {
  origin: corsOriginValidatorCallback, // Returns exact origin string, not *
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
  exposedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // CRITICAL: When true, origin MUST be exact string, not *
  preflightContinue: false, // Don't continue to next middleware for OPTIONS
  optionsSuccessStatus: 204, // Return 204 for OPTIONS (some clients expect this)
  maxAge: 86400, // Cache preflight requests for 24 hours
};

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

// CDN-friendly headers middleware
app.use((req, res, next) => {
  // Add CDN cache control headers
  if (req.path.startsWith('/api/')) {
    // API responses should be cached by CDN with shorter TTL
    res.setHeader('CDN-Cache-Control', 'public, max-age=300, s-maxage=300');
  } else if (req.path.match(/\.(js|css|woff2|woff|ttf|eot|jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    // Static assets can be cached longer
    res.setHeader('CDN-Cache-Control', 'public, max-age=31536000, immutable');
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

// Additional health check endpoint with more details (after middleware)
app.get("/health/detailed", (req, res) => {
  res.json({
    status: "ok",
    message: "API is running",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Metrics endpoint for monitoring
app.get("/metrics", (req, res) => {
  // Optional: Add authentication for metrics endpoint in production
  if (process.env.NODE_ENV === "production" && req.headers["x-api-key"] !== process.env.METRICS_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json(getMetrics());
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
