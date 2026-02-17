import { API_BASE } from "@/lib/config";
import type { Review } from "@/contexts/ReviewsContext";

// Use relative URL in development (to use Vite proxy) or full URL in production
const getApiUrl = (path: string): string => {
  // In development, use relative URL to leverage Vite proxy
  if (import.meta.env.DEV) {
    return `/api${path}`;
  }
  // In production, use full API_BASE URL
  return `${API_BASE}/api${path}`;
};

export interface CreateReviewData {
  rating: number;
  comment?: string;
  author?: string;
  photo?: string;
}

// API returns dates as ISO strings, we convert them to Date objects
interface ReviewFromAPI {
  id: string;
  rating: number;
  comment?: string;
  author?: string;
  date: string; // ISO string from API
  verified?: boolean;
  photo?: string;
}

export interface ReviewsResponse {
  success: boolean;
  reviews: ReviewFromAPI[];
}

export interface CreateReviewResponse {
  success: boolean;
  review: ReviewFromAPI;
}

export interface DeleteReviewResponse {
  success: boolean;
  message: string;
}

/**
 * Fetch all reviews from the API
 */
export async function fetchReviews(): Promise<Review[]> {
  try {
    const url = getApiUrl("/reviews");
    console.log("Fetching reviews from:", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(`Failed to fetch reviews: ${response.status} ${response.statusText}`);
    }

    const data: ReviewsResponse = await response.json();
    console.log("Fetched reviews from server:", data.reviews.length);
    
    // Convert date strings to Date objects
    return data.reviews.map((review) => ({
      ...review,
      date: new Date(review.date),
    }));
  } catch (error) {
    console.error("Error fetching reviews from API:", error);
    // Re-throw the error so the context can handle it properly
    throw error;
  }
}

/**
 * Create a new review
 */
export async function createReview(reviewData: CreateReviewData): Promise<Review> {
  try {
    const url = getApiUrl("/reviews");
    console.log("Creating review at:", url, reviewData);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reviewData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Failed to create review: ${response.status} ${response.statusText}`;
      console.error("API Error creating review:", errorMessage);
      throw new Error(errorMessage);
    }

    const data: CreateReviewResponse = await response.json();
    console.log("Review created successfully:", data.review);
    
    // Convert date string to Date object
    return {
      ...data.review,
      date: new Date(data.review.date),
    };
  } catch (error) {
    console.error("Error creating review:", error);
    throw error;
  }
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string): Promise<void> {
  try {
    const url = getApiUrl(`/reviews/${reviewId}`);
    console.log("Deleting review at:", url);
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete review: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
}
