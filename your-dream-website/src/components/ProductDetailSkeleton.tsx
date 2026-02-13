import { Skeleton } from "@/components/ui/skeleton";

const ProductDetailSkeleton = () => {
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-6 lg:px-12 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image section skeleton */}
          <div className="space-y-4">
            <Skeleton className="aspect-[3/4] w-full rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-20 w-20 rounded-lg" />
              <Skeleton className="h-20 w-20 rounded-lg" />
              <Skeleton className="h-20 w-20 rounded-lg" />
            </div>
          </div>

          {/* Product info skeleton */}
          <div className="space-y-6">
            {/* Breadcrumb skeleton */}
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>

            {/* Product name skeleton */}
            <Skeleton className="h-10 w-3/4" />

            {/* Price skeleton */}
            <Skeleton className="h-8 w-32" />

            {/* Description skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Size selector skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <div className="flex gap-2 flex-wrap">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-28" />
              </div>
            </div>

            {/* Quantity selector skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded" />
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-10 w-10 rounded" />
              </div>
            </div>

            {/* Action buttons skeleton */}
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-12 flex-1 rounded-md" />
              <Skeleton className="h-12 flex-1 rounded-md" />
            </div>

            {/* Notes section skeleton */}
            <div className="space-y-3 pt-6 border-t">
              <Skeleton className="h-5 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;

