import { useEffect, useRef } from "react";

interface LiveRegionProps {
  message: string;
  priority?: "polite" | "assertive";
}

const LiveRegion = ({ message, priority = "polite" }: LiveRegionProps) => {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && liveRegionRef.current) {
      // Clear previous message
      liveRegionRef.current.textContent = "";
      // Small delay to ensure screen readers pick up the change
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = message;
        }
      }, 100);
    }
  }, [message]);

  return (
    <div
      ref={liveRegionRef}
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    />
  );
};

export default LiveRegion;

