import { Skeleton } from "@/components/ui/skeleton";

const CartItemSkeleton = () => {
  return (
    <div className="flex gap-4">
      {/* Product Image Skeleton */}
      <div className="w-24 h-24 bg-white rounded-sm overflow-hidden flex-shrink-0">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Product Info Skeleton */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/3 mb-1" />
          <Skeleton className="h-3 w-1/2" />
        </div>

        {/* Quantity Selector and Remove Skeleton */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="w-8 h-4" />
            <Skeleton className="w-6 h-6 rounded" />
          </div>
          <Skeleton className="w-6 h-6 rounded" />
        </div>
      </div>
    </div>
  );
};

export default CartItemSkeleton;

