import logger from "../utils/logger.js";
import { ApiError } from "./errorHandler.js";

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ENTRIES = 5000;

// key -> { createdAt, status, body, headers }
const store = new Map();
// key -> Promise in-flight marker
const inFlight = new Set();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.createdAt > DEFAULT_TTL_MS) {
      store.delete(key);
    }
  }
  // Simple bound to prevent unbounded growth
  if (store.size > MAX_ENTRIES) {
    const extra = store.size - MAX_ENTRIES;
    const keys = Array.from(store.keys()).slice(0, extra);
    keys.forEach((k) => store.delete(k));
  }
}

function getKey(req) {
  const raw = req.header("Idempotency-Key") || req.header("idempotency-key");
  if (!raw) return null;
  if (typeof raw !== "string") return null;
  const key = raw.trim();
  if (!key) return null;
  if (key.length > 200) throw new ApiError(400, "Invalid Idempotency-Key");
  return key;
}

/**
 * Idempotency middleware for POST endpoints.
 *
 * - If the same Idempotency-Key was already completed, returns the stored response.
 * - If it's currently in-flight, returns 409 to prevent duplicates.
 * - Otherwise allows request to proceed, and captures JSON response for replay.
 */
export function idempotencyMiddleware(req, res, next) {
  try {
    cleanup();

    const key = getKey(req);
    if (!key) return next();

    const existing = store.get(key);
    if (existing) {
      logger.warn("Idempotent replay", { key, path: req.originalUrl });
      if (!res.headersSent) {
        res.setHeader("X-Idempotent-Replay", "1");
      }
      return res.status(existing.status).json(existing.body);
    }

    if (inFlight.has(key)) {
      throw new ApiError(409, "Duplicate request in progress. Please wait.");
    }

    inFlight.add(key);

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      try {
        store.set(key, {
          createdAt: Date.now(),
          status: res.statusCode || 200,
          body,
        });
      } finally {
        inFlight.delete(key);
      }
      return originalJson(body);
    };

    res.on("close", () => {
      inFlight.delete(key);
    });

    next();
  } catch (err) {
    next(err);
  }
}

