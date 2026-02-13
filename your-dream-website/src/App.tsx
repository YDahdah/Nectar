import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { ShopProvider } from "@/contexts/ShopContext";
import { ReviewsProvider } from "@/contexts/ReviewsContext";
import { Skeleton } from "@/components/ui/skeleton";
import WebsiteStructuredData from "@/components/WebsiteStructuredData";
import BackToTop from "@/components/BackToTop";
import ErrorBoundary from "@/components/ErrorBoundary";
import PrefetchRoutes from "@/components/PrefetchRoutes";
import { useServiceWorker } from "@/hooks/use-service-worker";

// Preload Index page immediately since it's the homepage
import Index from "./pages/Index";

// Lazy load other routes for code splitting
const Shop = lazy(() => import("./pages/Shop"));
const Product = lazy(() => import("./pages/Product"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="min-h-screen bg-white">
    <div className="border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="w-5 h-5 rounded" />
          </div>
        </div>
      </div>
    </div>
    <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-12">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

const App = () => {
  // Register service worker for offline support
  useServiceWorker();

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to error reporting service in production
        if (process.env.NODE_ENV === "production") {
          // Example: Sentry.captureException(error, { extra: errorInfo });
          console.error("Application error:", error, errorInfo);
        }
      }}
    >
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <ShopProvider>
          <ReviewsProvider>
            <TooltipProvider>
              <WebsiteStructuredData />
              <Toaster />
              <Sonner />
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <PrefetchRoutes />
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/product/:id" element={<Product />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/order-confirmation" element={<OrderConfirmation />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    <BackToTop />
                  </Suspense>
                </ErrorBoundary>
              </BrowserRouter>
            </TooltipProvider>
          </ReviewsProvider>
        </ShopProvider>
      </CartProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
