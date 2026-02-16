/**
 * Performance monitoring middleware
 * Tracks response times, request counts, and provides metrics endpoint
 */

import logger from "../utils/logger.js";

// In-memory metrics store
// For production, consider using Prometheus, DataDog, or similar
const metrics = {
  requests: {
    total: 0,
    byMethod: {},
    byRoute: {},
    errors: 0,
  },
  responseTimes: [],
  startTime: Date.now(),
};

/**
 * Performance monitoring middleware
 * Tracks request/response metrics
 */
export function performanceMiddleware(req, res, next) {
  const startTime = Date.now();
  const route = req.route?.path || req.path;

  // Increment request counters
  metrics.requests.total++;
  metrics.requests.byMethod[req.method] =
    (metrics.requests.byMethod[req.method] || 0) + 1;
  metrics.requests.byRoute[route] = (metrics.requests.byRoute[route] || 0) + 1;

  // Track response time
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    metrics.responseTimes.push(duration);

    // Keep only last 1000 response times to prevent memory issues
    if (metrics.responseTimes.length > 1000) {
      metrics.responseTimes.shift();
    }

    // Track errors
    if (res.statusCode >= 400) {
      metrics.requests.errors++;
    }

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn(
        `Slow request: ${req.method} ${route} took ${duration}ms (Status: ${res.statusCode})`
      );
    }

    // Add performance headers
    res.setHeader("X-Response-Time", `${duration}ms`);
  });

  next();
}

/**
 * Get performance metrics
 */
export function getMetrics() {
  const responseTimes = metrics.responseTimes;
  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
  const p95ResponseTime =
    responseTimes.length > 0
      ? responseTimes.sort((a, b) => a - b)[
          Math.floor(responseTimes.length * 0.95)
        ]
      : 0;
  const p99ResponseTime =
    responseTimes.length > 0
      ? responseTimes.sort((a, b) => a - b)[
          Math.floor(responseTimes.length * 0.99)
        ]
      : 0;

  const uptime = Date.now() - metrics.startTime;

  return {
    uptime: {
      seconds: Math.floor(uptime / 1000),
      minutes: Math.floor(uptime / 60000),
      hours: Math.floor(uptime / 3600000),
      formatted: formatUptime(uptime),
    },
    requests: {
      total: metrics.requests.total,
      byMethod: metrics.requests.byMethod,
      byRoute: metrics.requests.byRoute,
      errors: metrics.requests.errors,
      errorRate:
        metrics.requests.total > 0
          ? ((metrics.requests.errors / metrics.requests.total) * 100).toFixed(
              2
            ) + "%"
          : "0%",
    },
    responseTime: {
      average: Math.round(avgResponseTime),
      p95: p95ResponseTime,
      p99: p99ResponseTime,
      min: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      max: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
    },
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
  };
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Reset metrics (useful for testing)
 */
export function resetMetrics() {
  metrics.requests = {
    total: 0,
    byMethod: {},
    byRoute: {},
    errors: 0,
  };
  metrics.responseTimes = [];
  metrics.startTime = Date.now();
}

export default performanceMiddleware;
