import { describe, expect, it } from "vitest";
import { generateExplanation } from "../generateExplanation";
import type { TrustScoreResult } from "@/modules/trust-score/domain/trustScore.types";
import type { DealScoreResult } from "@/modules/deal-score/domain/dealScore.types";

const breakdown = {
  addressValidity: 70,
  mediaQuality: 70,
  identityVerification: 70,
  sellerDeclarationCompleteness: 70,
  legalReadiness: 70,
  dataConsistency: 70,
};

const conf = {
  addressConfidence: 70,
  mediaConfidence: 70,
  identityConfidence: 70,
  declarationConfidence: 70,
  legalConfidence: 70,
};

describe("generateExplanation", () => {
  it("deterministic summary reflects actual trust and deal scores", async () => {
    const trust: TrustScoreResult = {
      trustScore: 62,
      trustScoreRaw: 65,
      trustConfidence: 58,
      fraudPenalty: 0,
      level: "medium",
      issues: ["Missing exterior tag"],
      strengths: [],
      issueCodes: ["MEDIA_NO_EXTERIOR_TAG"],
      strengthCodes: [],
      breakdown,
      confidenceBreakdown: conf,
    };
    const deal: DealScoreResult = {
      dealScore: 58,
      dealScoreRaw: 60,
      riskAdjustedDealScore: 55,
      dealConfidence: 52,
      category: "average",
      recommendation: "worth_reviewing",
      riskScore: 44,
      analyzerRecommendation: "worth_reviewing",
      warnings: [],
    };
    const out = await generateExplanation({ trust, deal });
    expect(out.aiEnhanced).toBe(false);
    expect(out.summary).toContain("62");
    expect(out.summary).toContain("58");
    expect(out.warnings.some((w) => w.includes("Missing exterior"))).toBe(true);
  });
});
