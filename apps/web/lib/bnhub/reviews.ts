import type { GuestStayChecklist } from "@/lib/bnhub/stay-evaluation-ai";
import {
  createReview as createReviewCore,
  getPublicListingReviews,
  getListingRatingSummary,
} from "@/src/modules/reviews/reviewService";

export type CreateReviewPayload = {
  bookingId: string;
  guestId: string;
  listingId: string;
  propertyRating: number;
  hostRating?: number;
  cleanlinessRating?: number;
  accuracyRating?: number;
  communicationRating?: number;
  locationRating?: number;
  valueRating?: number;
  checkinRating?: number;
  comment?: string;
  stayChecklist?: GuestStayChecklist;
  amenitiesAsAdvertised?: boolean;
};

export async function createReview(data: CreateReviewPayload) {
  return createReviewCore(data.bookingId, data.guestId, data.listingId, {
    propertyRating: data.propertyRating,
    hostRating: data.hostRating,
    cleanlinessRating: data.cleanlinessRating,
    accuracyRating: data.accuracyRating,
    communicationRating: data.communicationRating,
    locationRating: data.locationRating,
    valueRating: data.valueRating,
    checkinRating: data.checkinRating,
    comment: data.comment,
    stayChecklist: data.stayChecklist,
    amenitiesAsAdvertised: data.amenitiesAsAdvertised,
  });
}

export async function getListingReviews(listingId: string, limit = 10) {
  const { reviews } = await getPublicListingReviews(listingId, { limit });
  return reviews;
}

export async function getListingRatingAggregate(listingId: string) {
  return getListingRatingSummary(listingId);
}

export function getListingAverageRating(reviews: { propertyRating: number }[]) {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((a, r) => a + r.propertyRating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
