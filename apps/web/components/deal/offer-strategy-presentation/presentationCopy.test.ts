import { describe, expect, it } from "vitest";
import {
  filterClientFacingWarnings,
  humanizeUnderscores,
  nextStepPlain,
  readinessLevel,
  summaryPlain,
} from "@/components/deal/offer-strategy-presentation/presentationCopy";
import type { OfferStrategyPublicDto } from "@/modules/deal-analyzer/domain/contracts";

function baseDto(over: Partial<OfferStrategyPublicDto> = {}): OfferStrategyPublicDto {
  return {
    id: "1",
    propertyId: "p",
    analysisId: null,
    suggestedMinOfferCents: 400_000_00,
    suggestedTargetOfferCents: 420_000_00,
    suggestedMaxOfferCents: 440_000_00,
    confidenceLevel: "medium",
    competitionSignal: "warm",
    riskLevel: "medium",
    offerBand: "at_ask",
    offerPosture: "balanced",
    recommendedConditions: [
      { category: "inspection", label: "Inspection clause", note: "Standard review period" },
    ],
    warnings: ["SECTION_KEY_MISSING", "Please confirm financing"],
    explanation: "Based on comparables.",
    updatedAt: new Date().toISOString(),
    ...over,
  };
}

describe("offer strategy presentation copy", () => {
  it("humanizes underscores", () => {
    expect(humanizeUnderscores("buy_to_live")).toBe("Buy To Live");
  });

  it("filters internal-style warnings in client mode", () => {
    const w = filterClientFacingWarnings(["FOO_BAR_BAZ", "Plain English warning"]);
    expect(w).toEqual(["Plain English warning"]);
  });

  it("readiness weakens when risk is high", () => {
    expect(readinessLevel(baseDto({ riskLevel: "high", confidenceLevel: "high" }))).toBe("needs_review");
  });

  it("next step references broker when warnings after filter", () => {
    const dto = baseDto({ warnings: ["Check roof age"] });
    expect(nextStepPlain(dto)).toContain("broker");
  });

  it("summary stays grounded from dto fields only", () => {
    const s = summaryPlain(baseDto());
    expect(s).toContain("At Ask");
    expect(s).toContain("Based on comparables.");
  });
});
