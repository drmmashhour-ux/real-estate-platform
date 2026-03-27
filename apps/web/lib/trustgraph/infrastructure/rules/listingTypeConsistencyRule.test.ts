import { describe, expect, it } from "vitest";
import { evaluateListingTypeConsistencyRule } from "@/lib/trustgraph/infrastructure/rules/listingTypeConsistencyRule";

const base = {
  listingId: "l1",
  ownerId: "u1",
  sellerPlan: "basic",
  address: "1 Main",
  city: "Montreal",
  images: [],
  photoTagsJson: [],
  sellerDeclarationJson: null,
  sellerDeclarationCompletedAt: null,
};

describe("listingTypeConsistencyRule", () => {
  it("flags house type with condo language", () => {
    const r = evaluateListingTypeConsistencyRule({
      ...base,
      propertyType: "SINGLE_FAMILY",
      title: "Nice place",
      description: "Beautiful condominium style living downtown",
    });
    expect(r.passed).toBe(false);
    expect(r.signals?.length).toBeGreaterThan(0);
  });
});
