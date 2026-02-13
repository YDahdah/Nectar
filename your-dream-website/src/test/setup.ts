import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// jsdom does not include IntersectionObserver (needed by framer-motion whileInView, OptimizedImage)
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: readonly number[] = [];
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// jsdom does not include ResizeObserver (needed by Radix UI)
class MockResizeObserver implements ResizeObserver {
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
}
window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
