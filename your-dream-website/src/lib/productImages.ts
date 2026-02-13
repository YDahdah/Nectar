/**
 * Central image map for product assets. Uses Vite's glob import so we don't
 * need 300+ static imports in products.ts, which speeds up initial load and parse.
 */
const glob = import.meta.glob<string>("@/assets/**/*.{png,jpg,jpeg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function normalizeKey(fullPath: string): string {
  const match = fullPath.replace(/\\/g, "/").match(/assets\/(.+)$/i);
  return match ? match[1] : fullPath;
}

const urlByPath: Record<string, string> = {};
for (const [path, url] of Object.entries(glob)) {
  urlByPath[normalizeKey(path)] = url;
}

/** Resolve asset path (e.g. "MEN/ACQUA DI GIO.png") to built URL. Uses fallback when path is missing. */
export function getProductImageUrl(assetPath: string): string {
  if (!assetPath || assetPath.startsWith("http") || assetPath.startsWith("/")) {
    return assetPath;
  }
  const normalized = assetPath.replace(/\\/g, "/");
  const url = urlByPath[normalized] ?? urlByPath[normalized.replace(/^\.\//, "")];
  return url ?? urlByPath[FALLBACK_IMAGE_PATH] ?? assetPath;
}

/** Fallback image path for products without a specific asset (hero bottle). */
export const FALLBACK_IMAGE_PATH = "MEN/ACQUA DI GIO.png";
