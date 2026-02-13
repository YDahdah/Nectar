import { useRef, useCallback } from "react";

interface PendingRequest {
  promise: Promise<unknown>;
  timestamp: number;
}

const requestCache = new Map<string, PendingRequest>();
const CACHE_DURATION = 5000; // 5 seconds

/**
 * Hook to deduplicate and cache API requests
 * Prevents multiple identical requests from being made simultaneously
 */
export function useRequestDeduplication() {
  const cacheRef = useRef(requestCache);

  const deduplicateRequest = useCallback(
    <T,>(
      key: string,
      requestFn: () => Promise<T>,
      cacheDuration: number = CACHE_DURATION
    ): Promise<T> => {
      const cache = cacheRef.current;
      const now = Date.now();
      const cached = cache.get(key);

      // Return cached promise if still valid
      if (cached && now - cached.timestamp < cacheDuration) {
        return cached.promise as Promise<T>;
      }

      // Create new request
      const promise = requestFn().catch((error) => {
        // Remove from cache on error
        cache.delete(key);
        throw error;
      });

      // Cache the promise
      cache.set(key, {
        promise,
        timestamp: now,
      });

      // Clean up old entries
      for (const [k, v] of cache.entries()) {
        if (now - v.timestamp > cacheDuration * 2) {
          cache.delete(k);
        }
      }

      return promise;
    },
    []
  );

  const clearCache = useCallback((key?: string) => {
    if (key) {
      cacheRef.current.delete(key);
    } else {
      cacheRef.current.clear();
    }
  }, []);

  return { deduplicateRequest, clearCache };
}
