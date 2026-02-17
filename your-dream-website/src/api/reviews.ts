import { API_BASE } from "@/lib/config";
import type { Review } from "@/contexts/ReviewsContext";

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
    const response = await fetch(`${API_BASE}/api/reviews`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch reviews: ${response.statusText}`);
    }

    const data: ReviewsResponse = await response.json();
    
    // Convert date strings to Date objects
    return data.reviews.map((review) => ({
      ...review,
      date: new Date(review.date),
    }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    // Return empty array on error (graceful degradation)
    return [];
  }
}

/**
 * Create a new review
 */
export async function createReview(reviewData: CreateReviewData): Promise<Review> {
  try {
    const response = await fetch(`${API_BASE}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reviewData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create review: ${response.statusText}`);
    }

    const data: CreateReviewResponse = await response.json();
    
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
    const response = await fetch(`${API_BASE}/api/reviews/${reviewId}`, {
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
