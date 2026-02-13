/**
 * Prefetch route chunks on hover/idle so navigation feels instant.
 * Call these from Link onMouseEnter or when link becomes visible.
 */
export function prefetchShop(): void {
  void import("./pages/Shop");
}

export function prefetchProduct(): void {
  void import("./pages/Product");
}

export function prefetchCart(): void {
  void import("./pages/Cart");
}

export function prefetchCheckout(): void {
  void import("./pages/Checkout");
}
