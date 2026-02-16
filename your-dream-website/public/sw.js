// Service Worker for advanced caching strategies
const CACHE_VERSION = "v2";
const CACHE_NAME = `nectar-perfume-${CACHE_VERSION}`;
const STATIC_CACHE = `nectar-static-${CACHE_VERSION}`;
const API_CACHE = `nectar-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `nectar-images-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/shop",
  "/cart",
];

// Cache duration settings (in milliseconds)
const CACHE_DURATIONS = {
  static: 7 * 24 * 60 * 60 * 1000, // 7 days
  api: 5 * 60 * 1000, // 5 minutes
  image: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Don't fail installation if some assets fail to cache
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Failed to cache some static assets:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.includes(CACHE_VERSION))
          .map((name) => {
            console.log("Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

/**
 * Check if request should be cached
 */
function shouldCache(request) {
  const url = new URL(request.url);
  
  // Don't cache non-GET requests
  if (request.method !== "GET") {
    return false;
  }

  // Don't cache API requests that shouldn't be cached
  if (url.pathname.startsWith("/api/") && 
      (url.pathname.includes("/orders") || url.pathname.includes("/checkout"))) {
    return false;
  }

  return true;
}

/**
 * Get appropriate cache name for request type
 */
function getCacheName(request) {
  const url = new URL(request.url);
  
  if (url.pathname.startsWith("/api/")) {
    return API_CACHE;
  }
  
  if (request.destination === "image" || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    return IMAGE_CACHE;
  }
  
  return STATIC_CACHE;
}

/**
 * Stale-while-revalidate strategy
 * Returns cached response immediately, then updates cache in background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Fetch fresh response in background
  const fetchPromise = fetch(request)
    .then((response) => {
      // Only cache successful responses
      if (response && response.status === 200 && response.type === "basic") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => {
      // If fetch fails, return cached response if available
      return cachedResponse;
    });

  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

/**
 * Network-first strategy with cache fallback
 * Good for API calls that need fresh data
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response && response.status === 200 && response.type === "basic") {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Cache-first strategy
 * Good for static assets
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === "basic") {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    throw error;
  }
}

// Fetch event - intelligent caching strategies
self.addEventListener("fetch", (event) => {
  if (!shouldCache(event.request)) {
    return;
  }

  const url = new URL(event.request.url);
  
  // Skip cross-origin requests (unless explicitly allowed)
  if (!url.origin.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    (async () => {
      const cacheName = getCacheName(event.request);
      
      // API calls: Network-first with cache fallback
      if (url.pathname.startsWith("/api/")) {
        return networkFirst(event.request, cacheName).catch(() => {
          // Return a generic error response if both network and cache fail
          return new Response(
            JSON.stringify({ error: "Network error" }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        });
      }
      
      // Images: Cache-first with stale-while-revalidate
      if (event.request.destination === "image" || 
          url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
        return staleWhileRevalidate(event.request, cacheName);
      }
      
      // Static assets (HTML, CSS, JS): Stale-while-revalidate
      if (url.pathname.match(/\.(html|css|js|woff2|woff|ttf|eot)$/i) ||
          event.request.destination === "style" ||
          event.request.destination === "script") {
        return staleWhileRevalidate(event.request, cacheName);
      }
      
      // Default: Network-first
      return networkFirst(event.request, cacheName);
    })()
  );
});

// Background sync for offline actions (optional enhancement)
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(
      // Implement background sync logic here
      Promise.resolve()
    );
  }
});

// Message handler for cache invalidation
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});
