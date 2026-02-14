/**
 * Product API layer – single place for all product access.
 * Today: sync passthrough to in-memory catalog.
 * Later: set USE_PRODUCTS_API in constants and swap to fetch(API_BASE + '/api/products')
 * so the rest of the app stays unchanged.
 */

import {
  products,
  getProductById as getById,
  getRelatedProducts as getRelated,
  getFeaturedProducts as getFeatured,
  getBrandFromName,
  getPriceBySize as getPriceBySizeFromCatalog,
  type Product,
} from "@/data/products";

export type { Product };

export interface ProductListFilters {
  gender?: "men" | "women" | "mix" | "all";
  brand?: string | null;
}

export interface ProductListResult {
  products: Product[];
  total: number;
}

export function getProductList(filters?: ProductListFilters): ProductListResult {
  let list = products;

  if (filters?.gender && filters.gender !== "all") {
    list = list.filter((p) => p.gender === filters.gender);
  }
  if (filters?.brand) {
    list = list.filter((p) => getBrandFromName(p.name) === filters.brand);
  }

  return { products: list, total: list.length };
}

export function getProductById(id: string): Product | undefined {
  return getById(id);
}

export function getRelatedProducts(productId: string, limit: number = 2): Product[] {
  return getRelated(productId, limit);
}

export function getFeaturedProducts(limit: number = 8): Product[] {
  return getFeatured(limit);
}

export function getAllBrands(productList?: Product[]): string[] {
  const list = productList ?? products;
  const brands = new Set<string>();
  list.forEach((p) => brands.add(getBrandFromName(p.name)));
  return Array.from(brands).sort();
}

export { getBrandFromName, getPriceBySizeFromCatalog as getPriceBySize };
