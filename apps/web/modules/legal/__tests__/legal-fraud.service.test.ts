import { describe, expect, it } from "vitest";
import { analyzeSellerDisclosureFraud } from "../legal-fraud.service";

describe("analyzeSellerDisclosureFraud", () => {
  it("flags latent-style contradiction between declaration no-issues and inspection wording", () => {
    const r = analyzeSellerDisclosureFraud({
      listingDescription: "Perfect condition home.",
      sellerDeclarationJson: { defects: "none", structuralIssues: "no problems" },
      inspectionNotes: "foundation crack visible",
    });
    expect(r.knownDefectNotDisclosed).toBe(true);
    expect(r.signals).toContain("KNOWN_DEFECT_NON_DISCLOSURE_PATTERN");
  });

  it("detects vague roof wording without year", () => {
    const r = analyzeSellerDisclosureFraud({
      listingDescription: "Roof renovated recently elastomer membrane",
      sellerDeclarationJson: null,
    });
    expect(r.vagueMaterialComponentWording).toBe(true);
    expect(r.signals).toContain("VAGUE_MATERIAL_COMPONENT_WORDING");
  });

  it("increases delta on recurring listings pattern", () => {
    const r = analyzeSellerDisclosureFraud({
      listingDescription: "Home",
      sellerDeclarationJson: null,
      sameSellerHighRiskListingCount: 3,
    });
    expect(r.recurringPattern).toBe(true);
    expect(r.misrepresentationDelta).toBeGreaterThan(20);
  });
});
