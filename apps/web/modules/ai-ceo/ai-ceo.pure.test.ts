import { describe, expect, it } from "vitest";

import { buildExplanation, thinDataDisclaimer } from "@/modules/ai-ceo/ai-ceo-explainability.service";
import {
  buildPrioritizedRecommendations,
  fingerprintForRecommendation,
  generateStrategicRecommendations,
} from "@/modules/ai-ceo/ai-ceo.engine";
import {
  assignPrioritizationBucket,
  prioritizationScore,
  prioritizeRecommendations,
} from "@/modules/ai-ceo/ai-ceo-prioritization.service";
import type { AiCeoPlatformContext, AiCeoRecommendationDraft } from "@/modules/ai-ceo/ai-ceo.types";

function baseCtx(over: Partial<AiCeoPlatformContext> = {}): AiCeoPlatformContext {
  return {
    generatedAt: new Date().toISOString(),
    executive: { financialHints: {}, platformHints: {}, riskLevel: null, snapshotAgeHours: null },
    revenue: { note: "", conversionProxy: null },
    deals: { activeCount: 0, stalledCount: 0, statusDistribution: [] },
    bookings: { bookingsToday: 1, bookingWindowNote: "" },
    autonomy: {
      autopilotExecutions7d: 0,
      blockRate: null,
      approvalQueueDepth: 0,
    },
    marketing: { campaignsTouchedMtd: 0, seoDraftInventory: 0 },
    capital: { note: "" },
    marketplace: { note: "" },
    learning: { outcomeLinked7d: 0, note: "" },
    coverage: { thinDataWarnings: [] },
    ...over,
  };
}

describe("fingerprintForRecommendation", () => {
  it("is stable for same parts", () => {
    expect(fingerprintForRecommendation(["a", "b"])).toBe(fingerprintForRecommendation(["a", "b"]));
  });

  it("differs when parts differ", () => {
    expect(fingerprintForRecommendation(["a", "b"])).not.toBe(fingerprintForRecommendation(["a", "c"]));
  });
});

describe("generateStrategicRecommendations", () => {
  it("always includes standing capital allocator review", () => {
    const ctx = baseCtx();
    const recs = generateStrategicRecommendations(ctx);
    expect(recs.some((r) => r.title.includes("allocator"))).toBe(true);
    expect(recs.every((r) => r.signalsUsed.length >= 1)).toBe(true);
  });

  it("emits stalled-deal recommendation when threshold met", () => {
    const ctx = baseCtx({ deals: { activeCount: 10, stalledCount: 3, statusDistribution: [] } });
    const recs = generateStrategicRecommendations(ctx);
    expect(recs.some((r) => r.summary.includes("3 deals"))).toBe(true);
  });

  it("tags high block rate as NEVER_AUTO", () => {
    const ctx = baseCtx({ autonomy: { autopilotExecutions7d: 50, blockRate: 0.3, approvalQueueDepth: 0 } });
    const recs = generateStrategicRecommendations(ctx);
    const friction = recs.find((r) => r.title.includes("friction"));
    expect(friction?.executionSafety).toBe("NEVER_AUTO");
  });
});

describe("prioritizeRecommendations", () => {
  it("partitions into four buckets", () => {
    const ctx = baseCtx({
      deals: { activeCount: 20, stalledCount: 8, statusDistribution: [] },
      autonomy: { autopilotExecutions7d: 100, blockRate: 0.4, approvalQueueDepth: 12 },
      revenue: { note: "", conversionProxy: 0.2 },
    });
    const set = buildPrioritizedRecommendations(ctx);
    const total =
      set.topPriorities.length +
      set.quickWins.length +
      set.highRiskHighReward.length +
      set.lowValue.length;
    const flat = generateStrategicRecommendations(ctx).length;
    expect(total).toBe(flat);
    expect(set.highRiskHighReward.some((r) => r.executionSafety === "NEVER_AUTO")).toBe(true);
  });

  it("assignPrioritizationBucket marks LOW_VALUE for weak scores", () => {
    const weak: AiCeoRecommendationDraft = {
      fingerprint: "x",
      title: "t",
      category: "cost",
      summary: "s",
      expectedImpactBand: "low",
      confidenceScore: 0.2,
      urgency: "low",
      requiredEffort: "high",
      affectedDomains: [],
      executionSafety: "ADVISORY_ONLY",
      signalsUsed: [],
      explanation: {
        dataTriggers: [],
        signalsContributing: [],
        whyItMatters: "",
        ifIgnored: "",
        dataBasisNote: "",
        confidenceRationale: "",
      },
      inputSnapshot: {},
    };
    const score = prioritizationScore(weak);
    expect(assignPrioritizationBucket(weak, score)).toBe("LOW_VALUE");
  });

  it("prioritizeRecommendations returns four arrays summing to input length", () => {
    const ctx = baseCtx();
    const drafts = generateStrategicRecommendations(ctx);
    const set = prioritizeRecommendations(drafts);
    expect(
      set.topPriorities.length +
        set.quickWins.length +
        set.highRiskHighReward.length +
        set.lowValue.length
    ).toBe(drafts.length);
  });
});

describe("explainability", () => {
  it("buildExplanation carries all narrative fields", () => {
    const e = buildExplanation({
      title: "Test",
      signals: [{ id: "s1", label: "L", value: 1, source: "src" }],
      triggers: ["t1"],
      whyItMatters: "why",
      ifIgnored: "ignore",
      dataBasisNote: "basis",
      confidenceRationale: "conf",
    });
    expect(e.signalsContributing).toHaveLength(1);
    expect(e.dataTriggers).toContain("t1");
    expect(e.whyItMatters).toBe("why");
    expect(e.ifIgnored).toBe("ignore");
  });

  it("thinDataDisclaimer mentions gaps when warnings exist", () => {
    const d = thinDataDisclaimer(baseCtx({ coverage: { thinDataWarnings: ["snap"] } }));
    expect(d.toLowerCase()).toContain("coverage gaps");
  });
});
