import { describe, expect, it } from "vitest";
import { aggregateFraudScore, computeFraudFamilies } from "../infrastructure/fraudSignalsService";

describe("fraudSignalsService", () => {
  it("raises aggregate score when duplicate media is present", () => {
    const base = computeFraudFamilies({
      listing: {
        id: "a",
        address: "123 Main St",
        city: "Montreal",
        propertyType: "SINGLE_FAMILY",
        images: ["x"],
        photoTagsJson: [],
        sellerDeclarationAiReviewJson: null,
        sellerDeclarationJson: {},
        priceCents: 400_000_00,
        status: "DRAFT",
        listingOwnerType: "SELLER",
        verification: null,
      } as never,
      duplicateImageListingIds: [],
    });
    const dup = computeFraudFamilies({
      listing: {
        id: "a",
        address: "123 Main St",
        city: "Montreal",
        propertyType: "SINGLE_FAMILY",
        images: ["x"],
        photoTagsJson: [],
        sellerDeclarationAiReviewJson: null,
        sellerDeclarationJson: {},
        priceCents: 400_000_00,
        status: "DRAFT",
        listingOwnerType: "SELLER",
        verification: null,
      } as never,
      duplicateImageListingIds: ["other-listing"],
    });
    expect(aggregateFraudScore(dup)).toBeGreaterThanOrEqual(aggregateFraudScore(base));
    expect(dup.mediaReuseRisk).toBeGreaterThan(base.mediaReuseRisk);
  });
});
