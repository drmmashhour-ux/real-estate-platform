import { describe, expect, it } from "vitest";
import { VerificationStatus } from "@prisma/client";
import { selectMarketingAngle, toneForAngle } from "./marketingAIService";

describe("marketingAIService", () => {
  it("selects luxury for high nightly price", () => {
    const angle = selectMarketingAngle({
      title: "Cozy studio",
      city: "Montreal",
      nightPriceCents: 20_000,
      maxGuests: 2,
      beds: 1,
      baths: 1,
      amenities: [],
      verificationStatus: VerificationStatus.VERIFIED,
    });
    expect(angle).toBe("luxury_stay");
    expect(toneForAngle(angle)).toBe("LUXURY");
  });

  it("selects family for high guest count", () => {
    const angle = selectMarketingAngle({
      title: "Big house",
      city: "Laval",
      nightPriceCents: 8_000,
      maxGuests: 6,
      beds: 4,
      baths: 2,
      amenities: ["crib"],
      verificationStatus: VerificationStatus.VERIFIED,
    });
    expect(angle).toBe("family_stay");
  });
});
