import { z } from "zod";

const rating1to5 = z.number().int().min(1).max(5);

export const createReviewBodySchema = z.object({
  bookingId: z.string().uuid(),
  guestId: z.string().uuid(),
  listingId: z.string().uuid(),
  propertyRating: rating1to5,
  hostRating: rating1to5.optional(),
  comment: z.string().max(5000).optional(),
});

export const listReviewsQuerySchema = z.object({
  listingId: z.string().uuid().optional(),
  guestId: z.string().uuid().optional(),
  hostId: z.string().uuid().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const moderateReviewBodySchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  moderatorId: z.string().uuid().optional(),
  rejectionReason: z.string().max(1000).optional(),
});

export const listingIdParamSchema = z.object({
  listingId: z.string().uuid(),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});

export const reviewIdParamSchema = z.object({
  reviewId: z.string().uuid(),
});

export type CreateReviewBody = z.infer<typeof createReviewBodySchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
export type ModerateReviewBody = z.infer<typeof moderateReviewBodySchema>;
export type ListingIdParam = z.infer<typeof listingIdParamSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type ReviewIdParam = z.infer<typeof reviewIdParamSchema>;
