import { describe, expect, it } from "vitest";
import { adminListingPreviewBodySchema } from "../zod-schemas";

describe("adminListingPreviewBodySchema", () => {
  it("accepts explicit Syria source", () => {
    const p = adminListingPreviewBodySchema.safeParse({
      listingId: "cl123",
      source: "syria",
      regionCode: "sy",
    });
    expect(p.success).toBe(true);
  });

  it("requires source field for admin preview variants", () => {
    const p = adminListingPreviewBodySchema.safeParse({ listingId: "cl123" });
    expect(p.success).toBe(false);
  });
});
