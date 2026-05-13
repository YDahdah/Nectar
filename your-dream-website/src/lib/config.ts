/** Dev: `/api` (Vite proxies to the Node server). Prod: set `VITE_API_BASE_URL` or absolute `VITE_API_URL`. */
function resolveApiBase(): string {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  const fromApiUrl = env?.VITE_API_URL?.trim();
  const fromBaseUrl = env?.VITE_API_BASE_URL?.trim();
  const raw = fromApiUrl || fromBaseUrl || "/api";
  const base = raw.replace(/\/$/, "");

  // Production safety net: if the build accidentally bakes in localhost,
  // calls would silently fail on the live domain. Fall back to same-origin
  // `/api` (which Firebase Hosting rewrites to the Cloud Function).
  if (typeof window !== "undefined") {
    const isLocalhostHost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const baseLooksLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(base);
    if (baseLooksLocal && !isLocalhostHost) {
      // eslint-disable-next-line no-console
      console.warn(
        "[config] VITE_API_URL points at localhost but the page is on " +
          window.location.hostname +
          ". Falling back to /api so requests reach the live backend.",
      );
      return "/api";
    }
  }

  return base;
}

// Backend API base (relative in dev → Vite `server.proxy` → http://localhost:3000).
export const API_BASE = resolveApiBase();

// Cloud Function URL for order processing
export const CLOUD_FUNCTION_URL =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_CLOUD_FUNCTION_URL
    ? import.meta.env.VITE_CLOUD_FUNCTION_URL.replace(/\/$/, "")
    : null; // Will fallback to API_BASE if not set

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const isAbsoluteBase = /^https?:\/\//i.test(API_BASE);

  // For absolute hosts, enforce /api prefix once to match backend mounts.
  if (isAbsoluteBase) {
    const baseWithApi = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;
    return `${baseWithApi}${normalizedPath}`;
  }

  // Relative bases (e.g. /api in local dev) already include proxy prefix.
  return `${API_BASE}${normalizedPath}`;
}


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