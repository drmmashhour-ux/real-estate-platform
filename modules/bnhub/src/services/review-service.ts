/**
 * BNHub review service — create review, list by listing.
 */

import type { BNHubReview } from "../models/index.js";

export interface BNHubReviewService {
  create(data: {
    listingId: string;
    bookingId: string;
    reviewerId: string;
    rating: number;
    comment?: string;
  }): Promise<BNHubReview>;
  listByListing(listingId: string, limit?: number): Promise<BNHubReview[]>;
}

export const bnhubReviewServiceStub: BNHubReviewService = {
  async create() {
    throw new Error("BNHub review service not implemented");
  },
  async listByListing() {
    return [];
  },
};
