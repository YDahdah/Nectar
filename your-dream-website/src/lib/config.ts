
// Backend API URL – set VITE_API_URL in .env for local override
export const API_BASE =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
    ? (import.meta.env.VITE_API_URL as string).replace(/\/$/, "")
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