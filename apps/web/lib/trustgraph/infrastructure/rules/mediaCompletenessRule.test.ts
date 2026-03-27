import { describe, expect, it } from "vitest";
import { evaluateMediaCompletenessRule } from "@/lib/trustgraph/infrastructure/rules/mediaCompletenessRule";

const base = {
  listingId: "l1",
  ownerId: "u1",
  sellerPlan: "basic",
  title: "t",
  description: "d",
  address: "a",
  city: "c",
  propertyType: "SINGLE_FAMILY",
  sellerDeclarationJson: null,
  sellerDeclarationCompletedAt: null,
};

describe("mediaCompletenessRule", () => {
  it("enforces free plan photo cap", () => {
    const urls = Array.from({ length: 6 }).map((_, i) => `https://x/${i}.jpg`);
    const r = evaluateMediaCompletenessRule({
      ...base,
      sellerPlan: "basic",
      images: urls,
      photoTagsJson: ["EXTERIOR", "OTHER", "OTHER", "OTHER", "OTHER", "OTHER"],
    });
    expect(r.passed).toBe(false);
    expect(r.ruleCode).toBe("media_completeness");
  });

  it("requires exterior tag", () => {
    const r = evaluateMediaCompletenessRule({
      ...base,
      images: ["https://x/1.jpg"],
      photoTagsJson: ["OTHER"],
    });
    expect(r.passed).toBe(false);
  });
});
