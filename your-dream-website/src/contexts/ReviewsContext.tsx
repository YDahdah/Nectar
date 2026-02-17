import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchReviews, createReview as createReviewAPI, deleteReview as deleteReviewAPI } from "@/api/reviews";

export interface Review {
  id: string;
  rating: number; // 1-5
  comment?: string;
  author?: string;
  date: Date;
  verified?: boolean;
  photo?: string; // Base64 encoded image or URL
}

interface ReviewsContextType {
  reviews: Review[];
  addReview: (rating: number, comment?: string, author?: string, photo?: string) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  getOverallRating: () => number;
  getRatingBreakdown: () => { stars: number; count: number; percentage: number }[];
  getTotalReviews: () => number;
  isLoading: boolean;
  error: string | null;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export const ReviewsProvider = ({ children }: { children: ReactNode }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load reviews from API on mount
  useEffect(() => {
    const loadReviews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const loadedReviews = await fetchReviews();
        console.log("Loaded reviews from server:", loadedReviews.length);
        setReviews(loadedReviews);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load reviews";
        console.error("Error loading reviews from server:", errorMessage);
        setError(errorMessage);
        // Start with empty array - don't use localStorage fallback
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, []);

  const addReview = async (rating: number, comment?: string, author?: string, photo?: string) => {
    try {
      setError(null);
      const newReview = await createReviewAPI({
        rating,
        comment,
        author,
        photo,
      });
      // Optimistically add the review immediately
      setReviews((prev) => [...prev, newReview]);
    } catch (err) {
      console.error("Error creating review:", err);
      setError(err instanceof Error ? err.message : "Failed to create review");
      throw err; // Re-throw so the UI can handle it
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      setError(null);
      await deleteReviewAPI(reviewId);
      // Optimistically remove the review immediately
      setReviews((prev) => prev.filter((review) => review.id !== reviewId));
    } catch (err) {
      console.error("Error deleting review:", err);
      setError(err instanceof Error ? err.message : "Failed to delete review");
      throw err; // Re-throw so the UI can handle it
    }
  };

  const getOverallRating = (): number => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 100) / 100; // Round to 2 decimal places
  };

  const getRatingBreakdown = (): { stars: number; count: number; percentage: number }[] => {
    const breakdown = [5, 4, 3, 2, 1].map((stars) => {
      const count = reviews.filter((review) => review.rating === stars).length;
      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
      return { stars, count, percentage };
    });
    return breakdown;
  };

  const getTotalReviews = (): number => {
    return reviews.length;
  };

  return (
    <ReviewsContext.Provider
      value={{
        reviews,
        addReview,
        deleteReview,
        getOverallRating,
        getRatingBreakdown,
        getTotalReviews,
        isLoading,
        error,
      }}
    >
      {children}
    </ReviewsContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (context === undefined) {
    throw new Error("useReviews must be used within a ReviewsProvider");
  }
  return context;
};
