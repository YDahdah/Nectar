import { useEffect, useCallback, useRef, useState } from "react";

interface UseInfiniteScrollOptions {
  /**
   * Callback function to load more data
   */
  loadMore: () => void | Promise<void>;
  /**
   * Whether there is more data to load
   */
  hasMore: boolean;
  /**
   * Whether data is currently loading
   */
  isLoading?: boolean;
  /**
   * Root element for intersection observer (defaults to window)
   */
  root?: Element | null;
  /**
   * Margin around root for triggering load (e.g., "100px")
   */
  rootMargin?: string;
  /**
   * Threshold for intersection (0-1)
   */
  threshold?: number;
  /**
   * Enable/disable the infinite scroll
   */
  enabled?: boolean;
}

/**
 * Hook for infinite scroll functionality using Intersection Observer API
 * Automatically loads more data when user scrolls near the bottom
 */
export function useInfiniteScroll({
  loadMore,
  hasMore,
  isLoading = false,
  root = null,
  rootMargin = "200px",
  threshold = 0,
  enabled = true,
}: UseInfiniteScrollOptions) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerTarget = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef(loadMore);
  const hasMoreRef = useRef(hasMore);

  // Keep refs updated
  useEffect(() => {
    loadMoreRef.current = loadMore;
    hasMoreRef.current = hasMore;
  }, [loadMore, hasMore]);

  // Handle intersection
  useEffect(() => {
    const target = observerTarget.current;
    if (!target || !enabled || !hasMoreRef.current || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsIntersecting(entry.isIntersecting);

        // Load more when intersecting and not already loading
        if (entry.isIntersecting && hasMoreRef.current && !isLoading) {
          loadMoreRef.current();
        }
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [root, rootMargin, threshold, enabled, isLoading]);

  // Ref callback to attach to the sentinel element
  const setObserverTarget = useCallback((node: HTMLDivElement | null) => {
    observerTarget.current = node;
  }, []);

  return {
    /**
     * Ref to attach to the sentinel element (usually placed at the bottom of the list)
     */
    observerRef: setObserverTarget,
    /**
     * Whether the observer target is currently intersecting
     */
    isIntersecting,
  };
}
