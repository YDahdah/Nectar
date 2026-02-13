import { usePrefetch } from "@/hooks/use-prefetch";

/**
 * Component to prefetch routes for better performance
 * Should be placed inside Router but outside Routes
 */
const PrefetchRoutes = () => {
  usePrefetch();
  return null;
};

export default PrefetchRoutes;
