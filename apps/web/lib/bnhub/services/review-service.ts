/**
 * BNHub ReviewService — create review, list reviews for listing.
 */

import { createReview, getListingReviews, getListingAverageRating } from "@/lib/bnhub/reviews";

export const ReviewService = {
  createReview(data: {
    bookingId: string;
    guestId: string;
    listingId: string;
    propertyRating: number;
    hostRating?: number;
    cleanlinessRating?: number;
    communicationRating?: number;
    locationRating?: number;
    valueRating?: number;
    comment?: string;
  }) {
    return createReview(data);
  },

  getReviewsForListing(listingId: string, limit = 10) {
    return getListingReviews(listingId, limit);
  },

  getAverageRating(reviews: { propertyRating: number }[]) {
    return getListingAverageRating(reviews);
  },
};
