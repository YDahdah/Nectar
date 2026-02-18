/**
 * Prometheus metrics middleware
 * Exposes metrics in Prometheus format for monitoring
 */

import logger from '../utils/logger.js';

// In-memory metrics store (for production, use prom-client library)
const metrics = {
  http_requests_total: 0,
  http_request_duration_seconds: [],
  http_requests_in_progress: 0,
  http_requests_errors_total: 0,
  startTime: Date.now(),
};

/**
 * Prometheus metrics middleware
 */
export function prometheusMiddleware(req, res, next) {
  const startTime = Date.now();
  metrics.http_requests_in_progress++;
  metrics.http_requests_total++;

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    metrics.http_request_duration_seconds.push(duration);
    
    // Keep only last 1000 durations
    if (metrics.http_request_duration_seconds.length > 1000) {
      metrics.http_request_duration_seconds.shift();
    }

    if (res.statusCode >= 400) {
      metrics.http_requests_errors_total++;
    }

    metrics.http_requests_in_progress--;
  });

  next();
}

/**
 * Get Prometheus-formatted metrics
 */
export function getPrometheusMetrics() {
  const durations = metrics.http_request_duration_seconds;
  const avgDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;
  
  const sortedDurations = [...durations].sort((a, b) => a - b);
  const p95Index = Math.floor(sortedDurations.length * 0.95);
  const p99Index = Math.floor(sortedDurations.length * 0.99);
  
  const p95 = sortedDurations.length > 0 ? sortedDurations[p95Index] : 0;
  const p99 = sortedDurations.length > 0 ? sortedDurations[p99Index] : 0;

  const uptime = (Date.now() - metrics.startTime) / 1000;

  // Prometheus format
  return `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${metrics.http_requests_total}

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds summary
http_request_duration_seconds{quantile="0.5"} ${avgDuration}
http_request_duration_seconds{quantile="0.95"} ${p95}
http_request_duration_seconds{quantile="0.99"} ${p99}
http_request_duration_seconds_sum ${durations.reduce((a, b) => a + b, 0)}
http_request_duration_seconds_count ${durations.length}

# HELP http_requests_in_progress Current number of HTTP requests in progress
# TYPE http_requests_in_progress gauge
http_requests_in_progress ${metrics.http_requests_in_progress}

# HELP http_requests_errors_total Total number of HTTP errors
# TYPE http_requests_errors_total counter
http_requests_errors_total ${metrics.http_requests_errors_total}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${uptime}

# HELP process_memory_bytes Process memory usage in bytes
# TYPE process_memory_bytes gauge
process_memory_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}
process_memory_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal}
process_memory_bytes{type="rss"} ${process.memoryUsage().rss}
`;
}

/**
 * Prometheus metrics endpoint handler
 */
export function prometheusMetricsHandler(req, res) {
  try {
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(getPrometheusMetrics());
  } catch (error) {
    logger.error('Error generating Prometheus metrics:', error);
    res.status(500).send('# Error generating metrics\n');
  }
}

export default prometheusMiddleware;
