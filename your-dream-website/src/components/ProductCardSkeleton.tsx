import { Skeleton } from "@/components/ui/skeleton";

const ProductCardSkeleton = () => {
  return (
    <div className="flex flex-col">
      {/* Product image skeleton */}
      <div className="relative bg-white rounded-sm overflow-hidden mb-0">
        <div className="aspect-[3/4] overflow-hidden">
          <Skeleton className="w-full h-full" />
        </div>
      </div>
      
      {/* Product info section skeleton */}
      <div className="bg-gray-100 p-3 flex-1 flex flex-col">
        {/* Product name skeleton */}
        <Skeleton className="h-4 w-3/4 mb-2" />
        
        {/* Price skeleton */}
        <Skeleton className="h-4 w-1/2 mb-3" />
        
        {/* Size selector skeleton */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-20" />
        </div>
        
        {/* Add to cart button skeleton */}
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;

