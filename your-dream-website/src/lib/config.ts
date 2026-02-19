// Backend API URL – no local fallback; use VITE_API_BASE_URL or production.
// If VITE_API_BASE_URL is relative (starts with /), it will use Vite proxy in dev
// If absolute (starts with http), it will call production server directly
export const API_BASE =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL
    ? (import.meta.env.VITE_API_BASE_URL as string).replace(/\/$/, "")
    : "https://api.perfumenectar.com";

// Cloud Function URL for order processing
export const CLOUD_FUNCTION_URL =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_CLOUD_FUNCTION_URL
    ? import.meta.env.VITE_CLOUD_FUNCTION_URL.replace(/\/$/, "")
    : null; // Will fallback to API_BASE if not set


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