/** Review submit — add POST /api/mobile/v1/reviews when wired to Prisma Review + eligibility */

import { mobileFetch } from "./apiClient";

export const getReviewEligibility = async (bookingId: string) => {
  const r = await mobileFetch<{ booking: { reviewEligible: boolean } }>(`/api/mobile/v1/bookings/${bookingId}`);
  return { eligible: r.booking.reviewEligible };
};

export const submitGuestReview = async (_payload: object) =>
  Promise.reject(new Error("POST review with categories + bookingId"));

export const submitHostResponse = async (_payload: object) =>
  Promise.reject(new Error("Host response on Review"));

export const reportReview = async (_payload: object) =>
  Promise.reject(new Error("POST bnhub_review_abuse_reports via API"));
