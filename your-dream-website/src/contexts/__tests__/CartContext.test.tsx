import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { CartProvider, useCart } from "../CartContext";

// Helper to render hook with provider
const renderCartHook = () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CartProvider>{children}</CartProvider>
  );

  return renderHook(() => useCart(), { wrapper });
};

describe("CartContext", () => {
  beforeEach(() => {
    // Reset cart before each test
    window.localStorage.clear();
  });

  it("initializes with empty cart", () => {
    const { result } = renderCartHook();

    expect(result.current.items).toEqual([]);
    expect(result.current.getTotalItems()).toBe(0);
    expect(result.current.getTotalPrice()).toBe(0);
  });

  it("adds item to cart", () => {
    const { result } = renderCartHook();

    act(() => {
      result.current.addToCart({
        id: "1",
        name: "Test Product",
        price: 50,
        image: "/test.jpg",
        size: "50ml",
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe("Test Product");
    expect(result.current.getTotalItems()).toBe(1);
    expect(result.current.getTotalPrice()).toBe(50);
  });

  it("updates quantity when adding same item", () => {
    const { result } = renderCartHook();

    act(() => {
      result.current.addToCart({
        id: "1",
        name: "Test Product",
        price: 50,
        image: "/test.jpg",
        size: "50ml",
      });
    });

    act(() => {
      result.current.addToCart({
        id: "1",
        name: "Test Product",
        price: 50,
        image: "/test.jpg",
        size: "50ml",
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.getTotalItems()).toBe(2);
    expect(result.current.getTotalPrice()).toBe(100);
  });

  it("treats different sizes as different items", () => {
    const { result } = renderCartHook();

    act(() => {
      result.current.addToCart({
        id: "1",
        name: "Test Product",
        price: 50,
        image: "/test.jpg",
        size: "50ml",
      });
    });

    act(() => {
      result.current.addToCart({
        id: "1",
        name: "Test Product",
        price: 80,
        image: "/test.jpg",
        size: "100ml",
      });
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.getTotalItems()).toBe(2);
    expect(result.current.getTotalPrice()).toBe(130);
  });

  it("removes item from cart", () => {
    const { result } = renderCartHook();

    act(() => {
      result.current.addToCart({
        id: "1",
        name: "Test Product",
        price: 50,
        image: "/test.jpg",
        size: "50ml",
      });
    });

    act(() => {
      result.current.removeFromCart("1", "50ml");
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.getTotalItems()).toBe(0);
  });

  it("updates item quantity", () => {
    const { result } = renderCartHook();

    act(() => {
      result.current.addToCart({
        id: "1",
        name: "Test Product",
        price: 50,
        image: "/test.jpg",
        size: "50ml",
      });
    });

    act(() => {
      result.current.updateQuantity("1", "50ml", 3);
    });

    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.getTotalItems()).toBe(3);
    expect(result.current.getTotalPrice()).toBe(150);
  });

  it("removes item when quantity is set to 0", () => {
    const { result } = renderCartHook();

    act(() => {
      result.current.addToCart({
        id: "1",
        name: "Test Product",
        price: 50,
        image: "/test.jpg",
        size: "50ml",
      });
    });

    act(() => {
      result.current.updateQuantity("1", "50ml", 0);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("clears cart", () => {
    const { result } = renderCartHook();

    act(() => {
      result.current.addToCart({
        id: "1",
        name: "Test Product",
        price: 50,
        image: "/test.jpg",
        size: "50ml",
      });
    });

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.getTotalItems()).toBe(0);
  });
});
