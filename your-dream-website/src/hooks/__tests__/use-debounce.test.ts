import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebounce } from "../use-debounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("test", 500));
    expect(result.current).toBe("test");
  });

  it("debounces value changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      }
    );

    expect(result.current).toBe("initial");

    // Change value
    rerender({ value: "updated", delay: 500 });

    // Value should still be initial immediately
    expect(result.current).toBe("initial");

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now value should be updated
    expect(result.current).toBe("updated");
  });

  it("uses custom delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 1000 },
      }
    );

    rerender({ value: "updated", delay: 1000 });

    // Value should not update before delay
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe("initial");

    // Value should update after delay
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe("updated");
  });

  it("cancels previous timeout on rapid changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      }
    );

    rerender({ value: "first", delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: "second", delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: "third", delay: 500 });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should only have the last value
    expect(result.current).toBe("third");
  });
});
