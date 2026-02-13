import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  addReview: (rating: number, comment?: string, author?: string, photo?: string) => void;
  getOverallRating: () => number;
  getRatingBreakdown: () => { stars: number; count: number; percentage: number }[];
  getTotalReviews: () => number;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

const STORAGE_KEY = "nectar_reviews";

// Load reviews from localStorage
const loadReviewsFromStorage = (): Review[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored) as Array<Omit<Review, "date"> & { date: string }>;
    // Convert date strings back to Date objects
    return parsed.map((review): Review => ({
      ...review,
      date: new Date(review.date),
    }));
  } catch (error) {
    console.error("Error loading reviews from storage:", error);
    return [];
  }
};

// Save reviews to localStorage
const saveReviewsToStorage = (reviews: Review[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch (error) {
    console.error("Error saving reviews to storage:", error);
  }
};

export const ReviewsProvider = ({ children }: { children: ReactNode }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load reviews from localStorage on mount
  useEffect(() => {
    const loadedReviews = loadReviewsFromStorage();
    setReviews(loadedReviews);
    setIsLoaded(true);
  }, []);

  // Save reviews to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveReviewsToStorage(reviews);
    }
  }, [reviews, isLoaded]);

  const addReview = (rating: number, comment?: string, author?: string, photo?: string) => {
    const newReview: Review = {
      id: Date.now().toString(),
      rating,
      comment,
      author,
      date: new Date(),
      verified: true, // Mark as verified
      photo,
    };
    setReviews((prev) => [...prev, newReview]);
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
        getOverallRating,
        getRatingBreakdown,
        getTotalReviews,
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

