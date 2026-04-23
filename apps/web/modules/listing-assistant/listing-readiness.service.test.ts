import { describe, expect, it } from "vitest";

import { computeListingReadiness } from "./listing-readiness.service";
import type { GeneratedListingContent } from "./listing-assistant.types";

const baseContent = (over: Partial<GeneratedListingContent> = {}): GeneratedListingContent => ({
  title: "Elegant home in Exampleville with great light",
  description: "A".repeat(200),
  propertyHighlights: ["a", "b", "c"],
  amenities: [],
  zoningNotes: "",
  disclaimers: [],
  keySellingPoints: [],
  targetBuyerProfile: "",
  centrisFormHints: { description: "", propertyHighlights: "", amenities: "", zoningNotes: "", disclaimers: "" },
  language: "en",
  ...over,
});

describe("computeListingReadiness", () => {
  it("flags needs_edits when compliance is medium", () => {
    const r = computeListingReadiness({
      content: baseContent(),
      compliance: { compliant: false, warnings: ["x"], riskLevel: "MEDIUM" },
      partial: { city: "Mtl", listingType: "HOUSE", priceMajor: 400_000 },
      pricing: null,
    });
    expect(r.readinessStatus).toBe("NEEDS_EDITS");
    expect(r.readinessScore).toBeLessThan(100);
  });

  it("escalates to high_risk for high compliance risk", () => {
    const r = computeListingReadiness({
      content: baseContent(),
      compliance: { compliant: false, warnings: ["a", "b", "c", "d"], riskLevel: "HIGH" },
      partial: {},
      pricing: {
        suggestedMinMajor: 1,
        suggestedMaxMajor: 2,
        priceBandLow: 1,
        priceBandHigh: 2,
        comparableCount: 1,
        confidenceLevel: "LOW",
        thinDataWarning: true,
        competitivenessScore: 40,
        rationale: "x",
      },
    });
    expect(r.readinessStatus).toBe("HIGH_RISK");
  });
});
