import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const CHUNK_RECOVERY_KEY = "chunk-reload-attempts";
const MAX_CHUNK_RECOVERY_ATTEMPTS = 3;

function getChunkRecoveryAttempts(): number {
  const raw = sessionStorage.getItem(CHUNK_RECOVERY_KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function setChunkRecoveryAttempts(value: number): void {
  sessionStorage.setItem(CHUNK_RECOVERY_KEY, String(value));
}

async function clearRuntimeCaches(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
  } catch {
    // Best effort only; continue with reload.
  }

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // Best effort only; continue with reload.
  }
}

function isChunkLikeError(message: string, errorName?: string): boolean {
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Loading chunk") ||
    message.includes("Loading CSS chunk") ||
    message.includes("Unexpected token '<'") ||
    errorName === "ChunkLoadError"
  );
}

async function recoverFromChunkError(message: string): Promise<void> {
  const attempts = getChunkRecoveryAttempts();
  if (attempts >= MAX_CHUNK_RECOVERY_ATTEMPTS) return;

  setChunkRecoveryAttempts(attempts + 1);
  console.warn("Chunk/module load error detected. Attempting hard recovery...", message);

  await clearRuntimeCaches();

  const url = new URL(window.location.href);
  url.searchParams.set("_chunkBust", String(Date.now()));
  window.location.replace(url.toString());
}

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

// Handle chunk/module loading errors (e.g., stale cached index or missing assets).
window.addEventListener("error", (event) => {
  const error = event.error;
  const message = error?.message || event.message || "";
  const target = event.target as HTMLElement | null;
  const isScriptTagError = target?.tagName === "SCRIPT";
  
  if (isChunkLikeError(message, error?.name) || (isScriptTagError && message.includes("module"))) {
    void recoverFromChunkError(message);
  }
});

// Also handle unhandled promise rejections from dynamic imports
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const message = reason?.message || String(reason) || "";
  
  if (isChunkLikeError(message, reason?.name)) {
    event.preventDefault(); // Prevent default error logging
    void recoverFromChunkError(message);
  }
});

// When the app stays healthy for a few seconds, clear recovery counter.
setTimeout(() => {
  sessionStorage.removeItem(CHUNK_RECOVERY_KEY);
}, 8000);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
