import { describe, expect, it } from "vitest";
import { deriveActionRecommendation } from "@/src/modules/ai-selection-engine/infrastructure/actionSelectionService";

describe("actionSelectionService", () => {
  it("returns verify_documents for high risk", () => {
    const result = deriveActionRecommendation({ score: 90, trustScore: 80, riskScore: 88, confidence: 75 });
    expect(result.action).toBe("verify_documents");
  });

  it("returns contact_now for strong low-risk opportunity", () => {
    const result = deriveActionRecommendation({ score: 85, trustScore: 72, riskScore: 30, confidence: 70 });
    expect(result.action).toBe("contact_now");
  });

  it("handles missing data deterministically", () => {
    const result = deriveActionRecommendation({ score: null, trustScore: null, riskScore: null, confidence: null });
    expect(result.action).toBe("wait");
  });
});
