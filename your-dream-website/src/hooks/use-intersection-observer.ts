import { useEffect, useRef, useState, RefObject } from "react";

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

/**
 * Hook to observe when an element enters the viewport
 * 
 * @param options - IntersectionObserver options
 * @returns [ref, isIntersecting] tuple
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [RefObject<HTMLElement>, boolean] {
  const {
    threshold = 0,
    root = null,
    rootMargin = "0%",
    triggerOnce = false,
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    // If already triggered and triggerOnce is true, don't observe again
    if (triggerOnce && hasTriggeredRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;

        if (isElementIntersecting) {
          setIsIntersecting(true);
          if (triggerOnce) {
            hasTriggeredRef.current = true;
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsIntersecting(false);
        }
      },
      {
        threshold,
        root,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, triggerOnce]);

  return [elementRef, isIntersecting];
}
