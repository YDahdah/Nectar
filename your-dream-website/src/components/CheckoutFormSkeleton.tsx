import { Skeleton } from "@/components/ui/skeleton";

const CheckoutFormSkeleton = () => {
  return (
    <div className="container mx-auto px-6 lg:px-12 max-w-4xl space-y-8 pt-8 pb-24">
      {/* Order Summary Skeleton */}
      <div className="bg-[#f5f5f0] rounded-md p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="space-y-4 pt-4 border-t border-gray-300">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex items-start gap-4">
              <Skeleton className="w-16 h-16 rounded-md" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
          <div className="pt-4 border-t border-gray-300 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Section Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-12 w-full rounded-md" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-12 rounded-md" />
          <Skeleton className="h-12 rounded-md" />
        </div>
        <Skeleton className="h-12 w-full rounded-md" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-12 rounded-md" />
          <Skeleton className="h-12 rounded-md" />
        </div>
        <Skeleton className="h-12 w-full rounded-md" />
      </div>

      {/* Shipping Method Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 w-full rounded-md" />
      </div>

      {/* Payment Section Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-16 w-full rounded-md" />
      </div>

      {/* Submit Button Skeleton */}
      <div className="pt-8">
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </div>
  );
};

export default CheckoutFormSkeleton;

