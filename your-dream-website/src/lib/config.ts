/**
 * App-wide configuration. Use env vars for deployment.
 * - VITE_API_URL: backend base URL (e.g. https://api.example.com or http://localhost:3000)
 * - VITE_CLOUD_FUNCTION_URL: Firebase Cloud Function URL for orders (e.g. https://europe-west1-PROJECT.cloudfunctions.net/createOrder)
 * - VITE_IMAGE_BASE_URL: optional CDN/base URL for images (e.g. https://cdn.example.com/assets)
 */

export const API_BASE =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
    : "http://localhost:3000";

// Cloud Function URL for order processing
export const CLOUD_FUNCTION_URL =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_CLOUD_FUNCTION_URL
    ? import.meta.env.VITE_CLOUD_FUNCTION_URL.replace(/\/$/, "")
    : null; // Will fallback to API_BASE if not set

/**
 * Resolve image URL. When VITE_IMAGE_BASE_URL is set (e.g. CDN), prepend it to relative paths.
 * Otherwise return src as-is (Vite will resolve imports).
 */
export function getImageUrl(src: string): string {
  if (typeof src !== "string" || !src) return src;
  const base =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_IMAGE_BASE_URL
      ? (import.meta.env.VITE_IMAGE_BASE_URL as string).replace(/\/$/, "")
      : "";
  if (!base) return src;
  // Only prepend for relative paths
  if (src.startsWith("http") || src.startsWith("//") || src.startsWith("data:")) return src;
  const path = src.startsWith("/") ? src.slice(1) : src;
  return `${base}/${path}`;
}
