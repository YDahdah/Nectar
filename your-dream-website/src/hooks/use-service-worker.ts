import { useEffect, useState } from "react";

/**
 * Service worker is disabled. This hook unregisters any existing service worker
 * so the app runs without a service worker.
 */
export function useServiceWorker() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      setIsSupported(true);
      // Unregister any existing service worker (service worker is disabled)
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
    }
  }, []);

  return { isSupported, isRegistered: false };
}
