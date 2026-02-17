import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress Firebase Performance Monitoring deprecated parameter warning
// This warning comes from Firebase Hosting's auto-injected scripts and doesn't affect functionality
if (typeof window !== "undefined") {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args.join(" ");
    // Suppress Firebase Performance deprecated parameter warning
    if (
      message.includes("deprecated parameters for the initialization function") ||
      (message.includes("feature_collector") && message.includes("deprecated parameters"))
    ) {
      return; // Suppress this specific warning
    }
    originalWarn.apply(console, args);
  };
}

// Handle chunk loading errors (e.g., when old chunks don't exist after deployment)
// This happens when index.html is cached but chunks have new hashes
window.addEventListener("error", (event) => {
  const error = event.error;
  const message = error?.message || event.message || "";
  
  // Check if it's a chunk loading error
  if (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Loading chunk") ||
    message.includes("Loading CSS chunk") ||
    (error?.name === "ChunkLoadError") ||
    (event.target && (event.target as HTMLElement).tagName === "SCRIPT" && message.includes("module"))
  ) {
    console.warn("Chunk loading error detected, reloading page to get fresh chunks...", message);
    // Reload the page to get fresh index.html with correct chunk references
    // Only reload once to avoid infinite loop
    if (!sessionStorage.getItem("chunk-reload-attempted")) {
      sessionStorage.setItem("chunk-reload-attempted", "true");
      window.location.reload();
    }
  }
});

// Also handle unhandled promise rejections from dynamic imports
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const message = reason?.message || String(reason) || "";
  
  // Check if it's a chunk loading error
  if (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Loading chunk") ||
    message.includes("Loading CSS chunk") ||
    (reason?.name === "ChunkLoadError")
  ) {
    console.warn("Chunk loading error detected in promise rejection, reloading page...", message);
    event.preventDefault(); // Prevent default error logging
    // Reload the page to get fresh index.html with correct chunk references
    if (!sessionStorage.getItem("chunk-reload-attempted")) {
      sessionStorage.setItem("chunk-reload-attempted", "true");
      window.location.reload();
    }
  }
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
