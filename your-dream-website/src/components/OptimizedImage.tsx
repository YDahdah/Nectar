import { useState, useEffect, memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

// Track preloaded links globally to avoid duplicates across components
const preloadedLinksSet = new Set<string>();

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  loading?: "lazy" | "eager";
  width?: number;
  height?: number;
  srcSet?: string;
  placeholder?: string;
}

const OptimizedImage = ({ 
  src, 
  alt, 
  className = "", 
  priority = false,
  sizes,
  loading = "lazy",
  width,
  height,
  srcSet,
  placeholder
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  // Only use explicit placeholder prop, don't auto-generate to avoid vite-imagetools issues
  const blurPlaceholder = placeholder || null;
  
  // Use intersection observer hook for better lazy loading with larger rootMargin for faster loading
  const [containerRef, isIntersecting] = useIntersectionObserver({
    rootMargin: priority ? "0px" : "1000px", // Increased to 1000px for even earlier loading
    threshold: 0,
    triggerOnce: true,
  });

  const shouldLoad = priority || isIntersecting;

  // Reset state when src changes
  useEffect(() => {
    if (imageSrc !== src) {
      setImageSrc(null);
      setIsLoaded(false);
      setHasError(false);
    }
  }, [src, imageSrc]);

  // Preload image when it should be loaded - use native browser preloading
  useEffect(() => {
    if (shouldLoad && src && imageSrc !== src && !hasError) {
      // Use native Image API for better performance
      const img = new Image();
      // Set decoding to async for non-blocking load
      img.decoding = "async";
      img.loading = priority ? "eager" : "lazy";
      
      // Set srcset if provided for responsive images
      if (srcSet) {
        img.srcset = srcSet;
      }
      
      img.src = src;
      
      // If already cached, load immediately
      if (img.complete) {
        setImageSrc(src);
        setIsLoaded(true);
      } else {
        img.onload = () => {
          setImageSrc(src);
          setIsLoaded(true);
        };
        img.onerror = () => {
          setHasError(true);
          setIsLoaded(true);
        };
      }
    }
  }, [shouldLoad, src, imageSrc, hasError, priority, srcSet]);

  // Preload critical images immediately (with deduplication)
  useEffect(() => {
    if (priority && src && typeof document !== "undefined") {
      // Check if already preloaded to avoid duplicates
      if (!preloadedLinksSet.has(src)) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = src;
        link.fetchPriority = "high";
        document.head.appendChild(link);
        preloadedLinksSet.add(src);
        
        return () => {
          // Cleanup on unmount (but keep in set to prevent re-adding)
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        };
      }
    }
  }, [priority, src]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {shouldLoad ? (
        <>
          {!isLoaded && !hasError && (
            <>
              {blurPlaceholder ? (
                <img
                  src={blurPlaceholder}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
                  aria-hidden="true"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <Skeleton className="absolute inset-0" />
              )}
            </>
          )}
          {hasError ? (
            <div 
              className={`${className} bg-muted flex items-center justify-center text-muted-foreground text-sm`}
              role="img"
              aria-label={alt}
            >
              Image unavailable
            </div>
          ) : (
            <img
              src={imageSrc || src}
              alt={alt}
              srcSet={srcSet}
              className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-200 relative z-10`}
              loading={priority ? "eager" : loading}
              decoding="async"
              sizes={sizes}
              width={width}
              height={height}
              {...(priority ? { fetchpriority: "high" } : {})}
              onLoad={() => setIsLoaded(true)}
              onError={() => {
                setIsLoaded(true);
                setHasError(true);
              }}
            />
          )}
        </>
      ) : (
        <Skeleton className="w-full h-full" />
      )}
    </div>
  );
};

export default memo(OptimizedImage);

