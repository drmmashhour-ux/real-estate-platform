import { Router, type Request, type Response } from "express";
import {
  createReviewBodySchema,
  listReviewsQuerySchema,
  moderateReviewBodySchema,
  listingIdParamSchema,
  userIdParamSchema,
  reviewIdParamSchema,
} from "../validation/schemas.js";
import { validateBody, validateParams, validateQuery, sendValidationError } from "../validation/validate.js";
import {
  createReview,
  listReviews,
  getListingRatings,
  getUserRatings,
  moderateReview,
} from "../reviews/reviewService.js";

export function createReviewsRouter(): Router {
  const router = Router();

  /** POST /reviews — create a review (guest, after completed stay). */
  router.post("/", async (req: Request, res: Response): Promise<void> => {
    const validation = validateBody(createReviewBodySchema, req.body);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    try {
      const review = await createReview(validation.data);
      res.status(201).json(review);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create review";
      const status =
        message.includes("not found") ||
        message.includes("Not your") ||
        message.includes("completed") ||
        message.includes("Already reviewed") ||
        message.includes("does not match")
          ? 400
          : 500;
      res.status(status).json({ error: { code: "REVIEW_ERROR", message } });
    }
  });

  /** GET /reviews — list reviews (filters: listingId, guestId, hostId, status; default status APPROVED). */
  router.get("/", async (req: Request, res: Response): Promise<void> => {
    const validation = validateQuery(listReviewsQuerySchema, req.query);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    try {
      const result = await listReviews(validation.data);
      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to list reviews" } });
    }
  });

  /** PATCH /reviews/:reviewId — moderate (approve/reject). */
  router.patch("/:reviewId", async (req: Request, res: Response): Promise<void> => {
    const paramValidation = validateParams(reviewIdParamSchema, req.params);
    if (!paramValidation.success) {
      sendValidationError(res, paramValidation.errors);
      return;
    }
    const bodyValidation = validateBody(moderateReviewBodySchema, req.body);
    if (!bodyValidation.success) {
      sendValidationError(res, bodyValidation.errors);
      return;
    }
    const updated = await moderateReview(paramValidation.data.reviewId, bodyValidation.data);
    if (!updated) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Review not found" } });
      return;
    }
    res.json(updated);
  });

  return router;
}

export function createRatingsRouter(): Router {
  const router = Router();

  /** GET /ratings/listing/:listingId — aggregate ratings for a listing. */
  router.get("/listing/:listingId", async (req: Request, res: Response): Promise<void> => {
    const validation = validateParams(listingIdParamSchema, req.params);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    try {
      const result = await getListingRatings(validation.data.listingId);
      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get ratings" } });
    }
  });

  /** GET /ratings/user/:userId — reputation scores for a user (as host and as guest). */
  router.get("/user/:userId", async (req: Request, res: Response): Promise<void> => {
    const validation = validateParams(userIdParamSchema, req.params);
    if (!validation.success) {
      sendValidationError(res, validation.errors);
      return;
    }
    try {
      const result = await getUserRatings(validation.data.userId);
      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Failed to get ratings" } });
    }
  });

  return router;
}
