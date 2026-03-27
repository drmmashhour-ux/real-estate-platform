import { describe, expect, it } from "vitest";
import { computeTrustComponents, trustScoreRawWeighted } from "../infrastructure/trustSignalsService";
import type { ListingTrustContext } from "../infrastructure/trustSignalsService";

function baseListing(over: Partial<ListingTrustContext["listing"]> = {}): ListingTrustContext["listing"] {
  return {
    id: "l1",
    ownerId: "u1",
    title: "Test",
    description: null,
    priceCents: 400_000_00,
    address: "123 Main Street, Montreal QC",
    city: "Montreal",
    province: "QC",
    postalCode: null,
    country: "CA",
    latitude: null,
    longitude: null,
    propertyType: "CONDO",
    bedrooms: 2,
    bathrooms: 1,
    surfaceSqft: 900,
    lotSizeSqft: null,
    yearBuilt: null,
    status: "ACTIVE",
    moderationStatus: "APPROVED",
    listingOwnerType: "OWNER",
    sellerDeclarationJson: {},
    sellerDeclarationCompletedAt: null,
    sellerDeclarationAiReviewJson: null,
    images: ["a.jpg", "b.jpg", "c.jpg"],
    photoTagsJson: ["EXTERIOR"],
    aiScoreReasonsJson: [],
    riskScore: 30,
    trustScore: 70,
    listingCode: null,
    rejectReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    verification: null,
    ...over,
  } as ListingTrustContext["listing"];
}

describe("computeTrustComponents", () => {
  it("flags very short address and lowers address component", () => {
    const ctx: ListingTrustContext = {
      listing: baseListing({ address: "ab", city: "X", images: ["x"] }),
    };
    const { breakdown, issues } = computeTrustComponents(ctx);
    expect(issues.some((i) => /address|city/i.test(i))).toBe(true);
    expect(breakdown.addressValidity).toBeLessThan(70);
  });

  it("penalizes missing media", () => {
    const ctx: ListingTrustContext = {
      listing: baseListing({ images: [] }),
    };
    const { issues, breakdown } = computeTrustComponents(ctx);
    expect(issues.some((i) => /photo/i.test(i))).toBe(true);
    expect(breakdown.mediaQuality).toBeLessThan(50);
  });

  it("lowers address score when condo is missing a unit number", () => {
    const withUnit: ListingTrustContext = {
      listing: baseListing({
        propertyType: "CONDO",
        address: "123 Main St, Unit 4, Montreal",
      }),
    };
    const noUnit: ListingTrustContext = {
      listing: baseListing({
        propertyType: "CONDO",
        address: "123 Main Street Montreal",
      }),
    };
    const a = computeTrustComponents(withUnit).breakdown.addressValidity;
    const b = computeTrustComponents(noUnit).breakdown.addressValidity;
    expect(b).toBeLessThan(a);
  });

  it("detects condo vs house wording mismatch", () => {
    const ctx: ListingTrustContext = {
      listing: baseListing({
        address: "Detached house on Maple Ave, Montreal",
        images: ["a", "b", "c"],
      }),
    };
    const { issues } = computeTrustComponents(ctx);
    expect(issues.some((i) => /condo|house|mismatch/i.test(i))).toBe(true);
  });
});

describe("trustScoreRawWeighted", () => {
  it("returns 0–100", () => {
    const ctx: ListingTrustContext = { listing: baseListing({ images: ["a", "b", "c", "d"] }) };
    const { breakdown } = computeTrustComponents(ctx);
    const s = trustScoreRawWeighted(breakdown);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});
