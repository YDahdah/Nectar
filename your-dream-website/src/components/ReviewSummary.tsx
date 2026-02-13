import { useState, useRef } from "react";
import { Check, Upload, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useReviews } from "@/contexts/ReviewsContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Star icon component - uses brand gold
const Star = ({ filled, size = "default" }: { filled: boolean; size?: "default" | "sm" }) => {
  const dim = size === "sm" ? 16 : 20;
  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M10 0L12.2451 6.90983H19.5106L13.6327 11.1803L15.8779 18.0902L10 13.8197L4.12215 18.0902L6.36729 11.1803L0.489435 6.90983H7.75486L10 0Z"
        fill={filled ? "hsl(var(--accent))" : "none"}
        stroke={filled ? "hsl(var(--accent))" : "hsl(var(--muted-foreground) / 0.35)"}
        strokeWidth="1"
      />
    </svg>
  );
};

// Star rating selector component
const StarRatingSelector = ({
  rating,
  onRatingChange,
}: {
  rating: number;
  onRatingChange: (rating: number) => void;
}) => {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className="cursor-pointer hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2 rounded transition-transform"
          aria-label={`Rate ${star} stars`}
        >
          <Star filled={star <= rating} />
        </button>
      ))}
    </div>
  );
};

const ReviewSummary = () => {
  const { reviews, getOverallRating, getRatingBreakdown, getTotalReviews, addReview } = useReviews();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [author, setAuthor] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRefEmpty = useRef<HTMLInputElement>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const overallRating = getOverallRating();
  const totalReviews = getTotalReviews();
  const ratingBreakdown = getRatingBreakdown();

  // Number of reviews to show before "Show more"
  const INITIAL_REVIEWS_SHOWN = 3;

  // Sort reviews by date (newest first) and filter to only show reviews with comments
  const sortedReviews = [...reviews]
    .filter((review) => review.comment && review.comment.trim().length > 0)
    .sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

  const visibleReviews = showAllReviews
    ? sortedReviews
    : sortedReviews.slice(0, INITIAL_REVIEWS_SHOWN);
  const hasMoreReviews = sortedReviews.length > INITIAL_REVIEWS_SHOWN;
  const hiddenCount = sortedReviews.length - INITIAL_REVIEWS_SHOWN;

  // Format date for display
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPhoto(base64String);
      setPhotoPreview(base64String);
    };
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read image file.",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (fileInputRefEmpty.current) {
      fileInputRefEmpty.current.value = '';
    }
  };

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    addReview(rating, comment || undefined, author || undefined, photo || undefined);
    setRating(0);
    setComment("");
    setAuthor("");
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (fileInputRefEmpty.current) {
      fileInputRefEmpty.current.value = '';
    }
    setIsDialogOpen(false);
    toast({
      title: "Review Submitted",
      description: "Thank you for your review!",
    });
  };

  // Empty state when no reviews
  if (totalReviews === 0) {
    return (
      <section className="py-16 lg:py-24 bg-[hsl(var(--card))]" aria-labelledby="reviews-heading-empty">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 id="reviews-heading-empty" className="font-serif text-2xl sm:text-3xl text-foreground mb-2">
              Customer Reviews
            </h2>
            <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground mb-8">
              Share your experience
            </p>
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-8 sm:p-10 mb-8 shadow-sm">
              <div className="flex items-center justify-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} filled={false} />
                ))}
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                No reviews yet. Be the first to share your thoughts.
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full sm:w-auto px-8 py-6 text-base font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 border border-[hsl(var(--primary))] rounded-full font-serif"
                  >
                    Write a Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg rounded-2xl border-[hsl(var(--border))] shadow-xl">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Write a Review</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-2">
                    Share your experience with our products.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Rating *</Label>
                    <StarRatingSelector rating={rating} onRatingChange={setRating} />
                  </div>
                    <div className="space-y-2">
                    <Label htmlFor="author-empty" className="text-sm font-medium">Your Name (Optional)</Label>
                    <Input
                      id="author-empty"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full rounded-lg border-[hsl(var(--input))] focus-visible:ring-[hsl(var(--accent))]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comment-empty" className="text-sm font-medium">Your Review (Optional)</Label>
                    <Textarea
                      id="comment-empty"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      rows={4}
                      className="w-full resize-none rounded-lg border-[hsl(var(--input))] focus-visible:ring-[hsl(var(--accent))]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photo-empty" className="text-sm font-medium">Upload Photo (Optional)</Label>
                    <div className="space-y-3">
                      {photoPreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-[hsl(var(--border))]">
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full h-48 object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur rounded-full shadow hover:bg-white transition-colors text-foreground border border-[hsl(var(--border))]"
                            aria-label="Remove photo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="photo-input-empty"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[hsl(var(--border))] rounded-xl cursor-pointer hover:bg-[hsl(var(--muted))]/50 hover:border-[hsl(var(--accent))]/50 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                          </div>
                          <input
                            id="photo-input-empty"
                            ref={fileInputRefEmpty}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="w-full sm:w-auto order-2 sm:order-1 rounded-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    className="w-full sm:w-auto bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 order-1 sm:order-2 rounded-full font-serif"
                  >
                    Submit Review
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-[hsl(var(--card))]" aria-labelledby="reviews-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <h2 id="reviews-heading" className="font-serif text-2xl sm:text-3xl text-foreground text-center mb-2">
            Customer Reviews
          </h2>
          <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground text-center mb-8">
            Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </p>

          {/* Overall Rating Card */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6 sm:p-8 mb-6 sm:mb-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} filled={i < Math.round(overallRating)} />
                  ))}
                </div>
                <div className="font-serif text-3xl sm:text-4xl font-normal text-foreground">
                  {overallRating.toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground">out of 5</p>
              </div>
              <div className="flex items-center justify-center sm:justify-end gap-2 text-muted-foreground">
                <Check className="w-4 h-4 text-[hsl(var(--accent))] shrink-0" aria-hidden />
                <span className="text-sm">Verified reviews</span>
              </div>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6 sm:p-8 mb-6 sm:mb-8 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Rating breakdown</h3>
            <div className="space-y-3">
              {ratingBreakdown.map((ratingItem) => (
                <div key={ratingItem.stars} className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="flex items-center gap-0.5 min-w-[72px] sm:min-w-[88px] shrink-0">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} filled={star <= ratingItem.stars} size="sm" />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0 h-2.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[hsl(var(--accent))] transition-all duration-500"
                      style={{ width: `${Math.max(ratingItem.percentage, 2)}%` }}
                    />
                  </div>
                  <span className="min-w-[28px] text-right text-sm text-muted-foreground tabular-nums">
                    {ratingItem.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Write a Review Button */}
          <div className="text-center mb-12">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-8 py-6 text-base font-medium rounded-full border-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))] font-serif"
                >
                  Write a Review
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg rounded-2xl border-[hsl(var(--border))] shadow-xl">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Write a Review</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-2">
                    Share your experience with our products.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Rating *</Label>
                    <StarRatingSelector rating={rating} onRatingChange={setRating} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author" className="text-sm font-medium">Your Name (Optional)</Label>
                    <Input
                      id="author"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full rounded-lg border-[hsl(var(--input))] focus-visible:ring-[hsl(var(--accent))]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comment" className="text-sm font-medium">Your Review (Optional)</Label>
                    <Textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      rows={4}
                      className="w-full resize-none rounded-lg border-[hsl(var(--input))] focus-visible:ring-[hsl(var(--accent))]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photo" className="text-sm font-medium">Upload Photo (Optional)</Label>
                    <div className="space-y-3">
                      {photoPreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-[hsl(var(--border))]">
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full h-48 object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur rounded-full shadow hover:bg-white transition-colors text-foreground border border-[hsl(var(--border))]"
                            aria-label="Remove photo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="photo-input"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[hsl(var(--border))] rounded-xl cursor-pointer hover:bg-[hsl(var(--muted))]/50 hover:border-[hsl(var(--accent))]/50 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                          </div>
                          <input
                            id="photo-input"
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="w-full sm:w-auto order-2 sm:order-1 rounded-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    className="w-full sm:w-auto bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 order-1 sm:order-2 rounded-full font-serif"
                  >
                    Submit Review
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Individual Reviews */}
          {sortedReviews.length > 0 && (
            <div className="space-y-4 mt-12">
              <h3 className="font-serif text-xl font-medium text-foreground">What customers are saying</h3>
              {visibleReviews.map((review, index) => (
                <motion.article
                  key={review.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(index, 5) * 0.05 }}
                  className="rounded-2xl border border-[hsl(var(--border))] bg-white p-5 sm:p-6 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center font-serif text-sm font-medium text-foreground">
                      {(review.author || "A").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">
                          {review.author || "Anonymous"}
                        </span>
                        {review.verified && (
                          <span className="inline-flex items-center gap-1 text-xs text-[hsl(var(--accent))]">
                            <Check className="w-3.5 h-3.5" aria-hidden />
                            Verified
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {formatDate(review.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} filled={star <= review.rating} size="sm" />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-foreground leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                      {review.photo && (
                        <div className="mt-4">
                          <img
                            src={review.photo}
                            alt="Review photo"
                            className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl border border-[hsl(var(--border))] object-cover cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                            loading="lazy"
                            onClick={() => {
                              const newWindow = window.open();
                              if (newWindow) {
                                newWindow.document.write(`<img src="${review.photo}" style="max-width: 100%; height: auto;" />`);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
              {hasMoreReviews && (
                <div className="pt-2 flex justify-center">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAllReviews((prev) => !prev)}
                    className="text-muted-foreground hover:text-foreground font-medium rounded-full"
                    aria-expanded={showAllReviews}
                  >
                    {showAllReviews ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1.5 inline-block" aria-hidden />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1.5 inline-block" aria-hidden />
                        Show more ({hiddenCount} {hiddenCount === 1 ? "review" : "reviews"})
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default ReviewSummary;

