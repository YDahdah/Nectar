import { useEffect, useRef, RefObject } from "react";

interface UseFocusTrapOptions {
  enabled?: boolean;
  initialFocus?: RefObject<HTMLElement>;
  returnFocus?: boolean;
}

/**
 * Hook to trap focus within a container element (useful for modals, dialogs)
 * 
 * @param containerRef - Ref to the container element
 * @param options - Configuration options
 * @returns Object with focus trap utilities
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  options: UseFocusTrapOptions = {}
) {
  const {
    enabled = true,
    initialFocus,
    returnFocus = true,
  } = options;

  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) {
      return;
    }

    const container = containerRef.current;

    // Store the previously focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Focus initial element if provided, otherwise focus first focusable element
    const focusInitialElement = () => {
      if (initialFocus?.current) {
        initialFocus.current.focus();
        return;
      }

      // Find first focusable element
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      const firstFocusable = container.querySelector<HTMLElement>(focusableSelectors);
      firstFocusable?.focus();
    };

    // Get all focusable elements within container
    const getFocusableElements = (): HTMLElement[] => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
    };

    // Handle Tab key to cycle through focusable elements
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements();
      
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const currentElement = document.activeElement as HTMLElement;

      // If Shift+Tab on first element, move to last
      if (e.shiftKey && currentElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
        return;
      }

      // If Tab on last element, move to first
      if (!e.shiftKey && currentElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
        return;
      }
    };

    // Handle clicks outside container (optional - can be disabled)
    const handleClickOutside = (e: MouseEvent) => {
      // This is optional - you might want to handle this in the parent component
      // Uncomment if you want to prevent clicks outside
      // if (!container.contains(e.target as Node)) {
      //   e.preventDefault();
      //   e.stopPropagation();
      // }
    };

    // Focus initial element
    focusInitialElement();

    // Add event listeners
    container.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside, true);

    // Cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside, true);

      // Return focus to previous element if enabled
      if (returnFocus && previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [enabled, containerRef, initialFocus, returnFocus]);
}
