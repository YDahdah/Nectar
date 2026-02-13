/**
 * Image preloading utility for better performance
 * Preloads images in batches to avoid blocking the main thread
 */

interface PreloadOptions {
  priority?: "high" | "low" | "auto";
  fetchPriority?: "high" | "low" | "auto";
}

// Track preloaded links to avoid duplicates
const preloadedLinks = new Set<string>();

/**
 * Preload a single image
 */
export function preloadImage(src: string, options: PreloadOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if image is already cached
    const img = new Image();
    
    if (options.priority === "high" || options.fetchPriority === "high") {
      // Use link preload for high priority images (only if not already preloaded)
      if (typeof document !== "undefined" && !preloadedLinks.has(src)) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = src;
        link.fetchPriority = "high";
        document.head.appendChild(link);
        preloadedLinks.add(src);
      }
      
      img.onload = () => resolve();
      img.onerror = () => {
        preloadedLinks.delete(src);
        reject(new Error(`Failed to preload image: ${src}`));
      };
    } else {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    }
    
    img.src = src;
    
    // If already cached, resolve immediately
    if (img.complete) {
      resolve();
    }
  });
}

/**
 * Preload multiple images in batches to avoid blocking
 * Improved with better concurrency control and request prioritization
 */
export async function preloadImages(
  sources: string[],
  options: PreloadOptions = {},
  batchSize: number = 6 // Increased batch size for better throughput
): Promise<void[]> {
  const results: Promise<void>[] = [];
  
  // Use requestIdleCallback for low priority images to avoid blocking main thread
  const scheduleBatch = (batch: string[], index: number): Promise<void[]> => {
    if (options.priority === "high" || index === 0) {
      // High priority or first batch: execute immediately
      return Promise.all(batch.map(src => preloadImage(src, options)));
    } else {
      // Low priority: use requestIdleCallback if available
      return new Promise((resolve) => {
        const executeBatch = () => {
          Promise.all(batch.map(src => preloadImage(src, options))).then(resolve);
        };
        
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          requestIdleCallback(executeBatch, { timeout: 2000 });
        } else {
          // Fallback: small delay
          setTimeout(executeBatch, index * 100);
        }
      });
    }
  };
  
  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize);
    const batchPromises = scheduleBatch(batch, batchIndex);
    results.push(...(await batchPromises));
  }
  
  return Promise.all(results);
}

/**
 * Preload critical images immediately (above-the-fold)
 * Uses parallel loading with priority hints for fastest loading
 * Note: preloadImage already handles link tag creation, so no duplicate here
 */
export function preloadCriticalImages(sources: string[]): void {
  // Load all critical images in parallel for fastest initial render
  // preloadImage function already creates link preload tags, so we don't duplicate
  const preloadPromises = sources.map(src => 
    preloadImage(src, { priority: "high", fetchPriority: "high" })
  );
  
  // Don't await - let them load in background
  Promise.allSettled(preloadPromises).catch(() => {
    // Silently fail - images will load normally via OptimizedImage component
  });
}
