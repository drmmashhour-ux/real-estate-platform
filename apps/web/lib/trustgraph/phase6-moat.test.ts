import { describe, expect, it } from "vitest";
import { normalizeMortgageFileExtraction, normalizeSellerDocumentExtraction } from "@/lib/trustgraph/infrastructure/services/extractionNormalizationService";
import { getPhase6MoatConfig } from "@/lib/trustgraph/config/phase6-moat";
import { geocodePrecisionScore } from "@/lib/trustgraph/infrastructure/services/geocodingValidationService";

describe("Phase 6 — extraction normalization", () => {
  it("maps seller declaration keys without overwriting user data (normalization is separate)", () => {
    const { normalized, confidence } = normalizeSellerDocumentExtraction({
      sellerDeclarationJson: { propertyType: "Detached", issues: "none" },
      fileName: "scan.pdf",
      category: "PROPERTY",
    });
    expect(normalized.propertyTypeHint).toBe("Detached");
    expect(confidence).toBeGreaterThan(0.4);
  });

  it("low-confidence mortgage extraction is flagged for review via threshold", () => {
    const prev = process.env.TRUSTGRAPH_EXTRACTION_REVIEW_BELOW;
    try {
      process.env.TRUSTGRAPH_EXTRACTION_REVIEW_BELOW = "0.6";
      const cfg = getPhase6MoatConfig();
      const { confidence } = normalizeMortgageFileExtraction({
        income: 0,
        employmentStatus: null,
        creditRange: null,
      });
      const reviewNeeded = confidence < cfg.extraction.reviewRequiredBelowConfidence;
      expect(reviewNeeded).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.TRUSTGRAPH_EXTRACTION_REVIEW_BELOW;
      else process.env.TRUSTGRAPH_EXTRACTION_REVIEW_BELOW = prev;
    }
  });
});

describe("Phase 6 — geospatial scoring", () => {
  it("weak precision yields low score (warning path, not auto-block)", () => {
    const s = geocodePrecisionScore({
      provider: "stub",
      version: "1",
      precision: "unknown",
      confidence: 0.3,
      matchedCity: "Toronto",
      matchedRegion: null,
    });
    expect(s).toBeLessThan(0.55);
  });
});
