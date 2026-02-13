import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { imagetools } from "vite-imagetools";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // Prevent serving TypeScript source files directly
    fs: {
      strict: true,
      allow: ['..'],
    },
    // Proxy API requests to production backend (avoids CORS in local dev)
    proxy: {
      '/api': {
        target: 'https://api.perfumenectar.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  plugins: [
    react({
      // Disable source maps to prevent browser from fetching .ts files
      tsDecorators: true,
    }),
    imagetools({
      defaultDirectives: (url) => {
        // Only apply WebP conversion if no format is already specified
        // This prevents double-processing and gives control when needed
        if (url.searchParams.has("format")) {
          return new URLSearchParams();
        }
        // Automatically convert to WebP with 85% quality for better compression
        return new URLSearchParams("format=webp&quality=85");
      },
    }),
    mode !== "development" && componentTagger(),
    // Dev: respond to /favicon.ico so browser doesn't get 404
    mode === "development" && {
      name: "favicon-ico",
      configureServer(server) {
        // Handle favicon requests
        server.middlewares.use((req, res, next) => {
          if (req.url === "/favicon.ico") {
            req.url = "/placeholder.svg";
          }
          next();
        });
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Ensure React is deduplicated - prevents multiple React instances
    dedupe: ["react", "react-dom"],
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    sourcemap: false, // Disable source maps in production
    assetsInlineLimit: 4096, // Inline small assets (< 4kb) as base64
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // CRITICAL: React and react-dom MUST be in the same chunk
          // This prevents "Cannot read properties of undefined" errors
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".") || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Enable compression
    reportCompressedSize: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "detect-node-es"],
    // Force React to be pre-bundled as a singleton
    force: true,
  },
  // Disable source maps in development to prevent browser from fetching .ts files
  esbuild: {
    sourcemap: false,
  },
  // Configure CSS to not generate source maps
  css: {
    devSourcemap: false,
  },
}));
