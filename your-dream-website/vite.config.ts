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
    // Proxy API requests in dev. Set VITE_PROXY_TARGET to use local backend (e.g. http://localhost:3000).
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // Keep the /api prefix when forwarding to backend
        rewrite: (path) => path,
      },
      // Also proxy /orders for backwards compatibility (though /api/orders should be used)
      '/orders': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // Rewrite /orders to /api/orders since backend mounts under /api
        rewrite: (path) => `/api${path}`,
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
    // Ensure React is always resolved from the same location
    preserveSymlinks: false,
  },
  build: {
    target: "esnext",
    minify: "esbuild", // Fastest minifier
    cssMinify: true,
    sourcemap: false, // Disable source maps in production for smaller bundles
    assetsInlineLimit: 4096, // Inline small assets (< 4kb) as base64
    // Optimize chunk size for better loading performance
    chunkSizeWarningLimit: 500, // Warn if chunks exceed 500kb
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    // Ensure proper module resolution for React
    modulePreload: {
      polyfill: true,
      resolveDependencies: (filename, deps) => {
        // Preload critical dependencies
        return deps.filter(dep => {
          // Preload React and router chunks
          return dep.includes('react-vendor') || dep.includes('router');
        });
      },
    },
    // Enable compression reporting
    reportCompressedSize: true,
    // Optimize rollup output
    rollupOptions: {
      output: {
        // Optimize chunk splitting for better caching
        manualChunks(id) {
          // Order matters: check specific chunks first before falling back to vendor
          
          // React core - most critical, should be cached longest
          // Must be loaded first before any Radix UI components
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('react/jsx-runtime')) {
            return 'react-vendor';
          }
          // Router - used across all routes
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
            return 'router';
          }
          // React Query - data fetching library
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'react-query';
          }
          // UI libraries - Radix UI (check before vendor to avoid circular deps)
          if (id.includes('node_modules/radix-ui') || id.includes('@radix-ui')) {
            return 'radix-ui';
          }
          // Animation library - can be lazy loaded
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }
          // Icons - large library, lazy load
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide';
          }
          // Form libraries - used in checkout
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform')) {
            return 'forms';
          }
          // Validation library
          if (id.includes('node_modules/zod')) {
            return 'validation';
          }
          // Date utilities
          if (id.includes('node_modules/date-fns')) {
            return 'date-utils';
          }
          // Charts - only used in admin/dashboard
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
          // Split large vendor chunks further for better caching
          if (id.includes('node_modules')) {
            // Split by package name for better cache invalidation
            const match = id.match(/node_modules\/([^/]+)/);
            if (match) {
              const packageName = match[1];
              // Keep small packages together
              if (['clsx', 'tailwind-merge', 'class-variance-authority'].includes(packageName)) {
                return 'utils';
              }
            }
          }
          // Other vendor libraries - only if not already matched above
          // This prevents circular dependencies by ensuring specific chunks are checked first
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
  },
  optimizeDeps: {
    include: [
      "react", 
      "react-dom", 
      "react-router-dom", 
      "detect-node-es",
      "@radix-ui/react-slot",
      "@radix-ui/react-primitive",
      "@radix-ui/react-context",
      "@radix-ui/react-compose-refs"
    ],
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
