import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
