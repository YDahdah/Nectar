import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Hook to prefetch routes and resources for better performance
 */
export function usePrefetch() {
  const location = useLocation();

  useEffect(() => {
    // Prefetch likely next routes based on current location
    const prefetchRoutes = () => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "document";

      // Prefetch common routes
      const routesToPrefetch = ["/shop", "/cart"];
      
      routesToPrefetch.forEach((route) => {
        if (location.pathname !== route) {
          const prefetchLink = document.createElement("link");
          prefetchLink.rel = "prefetch";
          prefetchLink.href = route;
          prefetchLink.as = "document";
          document.head.appendChild(prefetchLink);
        }
      });
    };

    // Prefetch on idle
    if ("requestIdleCallback" in window) {
      requestIdleCallback(prefetchRoutes, { timeout: 2000 });
    } else {
      setTimeout(prefetchRoutes, 2000);
    }
  }, [location.pathname]);
}

/**
 * Prefetch a specific route
 */
export function prefetchRoute(route: string) {
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = route;
  link.as = "document";
  document.head.appendChild(link);
}

/**
 * Prefetch an image
 */
export function prefetchImage(src: string) {
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = src;
  link.as = "image";
  document.head.appendChild(link);
}
