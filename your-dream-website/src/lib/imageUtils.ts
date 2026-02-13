/**
 * Image utility functions for optimization
 */

/**
 * Generate a low-quality image placeholder (LQIP) URL
 * This creates a tiny version of the image for blur-up effect
 * 
 * Note: Returns null for Vite-processed URLs to avoid vite-imagetools errors
 * In production, you could use a service like Cloudinary or Imgix for blur placeholders
 */
export function generateBlurPlaceholder(src: string): string | null {
  // Don't add query params to Vite-processed URLs (they cause vite-imagetools errors)
  // Vite-processed URLs typically contain /assets/ or are already optimized
  if (
    src.includes('/assets/') || 
    src.includes('?format=') || 
    src.includes('?w=') ||
    src.startsWith('/') && !src.startsWith('//') ||
    src.includes('data:')
  ) {
    // Return null to disable blur placeholder for Vite-processed images
    // The Skeleton component will be used instead
    return null;
  }
  
  // For external URLs, we could add query params, but for now disable to avoid issues
  return null;
}

/**
 * Generate responsive srcset for an image
 * Returns a srcset string with multiple sizes
 */
export function generateSrcSet(
  baseSrc: string,
  widths: number[] = [400, 800, 1200, 1600]
): string {
  return widths
    .map(width => {
      const separator = baseSrc.includes('?') ? '&' : '?';
      return `${baseSrc}${separator}w=${width} ${width}w`;
    })
    .join(', ');
}

/**
 * Check if image is already loaded/cached
 * Note: Use preloadImage from imagePreloader.ts for actual preloading
 */
export function isImageCached(src: string): boolean {
  if (typeof document === 'undefined') return false;
  
  const img = new Image();
  img.src = src;
  return img.complete;
}
