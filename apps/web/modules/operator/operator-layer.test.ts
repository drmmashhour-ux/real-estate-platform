import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeConfidenceLabel, clampScore } from "./confidence-normalizer.service";
import { mapAdsRecommendations, mapMarketplaceDecisions } from "./recommendation-mappers.service";
import { detectRecommendationConflicts, resolveConflictPriority } from "./conflict-resolution.service";
import { evaluateGuardrails } from "./guardrail-engine.service";
import { buildAssistantRecommendationFeed } from "./assistant-aggregator.service";
import type { AssistantRecommendation } from "./operator.types";
import * as loaders from "./recommendation-loaders.service";

vi.mock("@/config/feature-flags", () => ({
  operatorLayerFlags: {
    aiAssistantLayerV1: true,
    operatorApprovalsV1: false,
    operatorConflictsV1: true,
    operatorGuardrailsV1: true,
  },
  isOperatorGuardrailsEffective: () => true,
}));

vi.mock("./recommendation-loaders.service", () => ({
  getLatestAdsOperatorRecommendations: vi.fn(),
  getLatestProfitRecommendations: vi.fn(),
  getLatestCroRecommendations: vi.fn(),
  getLatestRetargetingRecommendations: vi.fn(),
  getLatestAbRecommendations: vi.fn(),
  getLatestMarketplaceRecommendations: vi.fn(),
  getLatestUnifiedMonitoringCard: vi.fn(),
}));

vi.mock("./operator.repository", () => ({
  saveRecommendations: vi.fn().mockResolvedValue({ saved: 0, skippedDeduped: 0, warnings: [] }),
  saveConflictSnapshots: vi.fn().mockResolvedValue({ saved: 0 }),
}));

describe("confidence-normalizer.service", () => {
  it("maps thresholds", () => {
    expect(normalizeConfidenceLabel(0.9)).toBe("HIGH");
    expect(normalizeConfidenceLabel(0.7)).toBe("MEDIUM");
    expect(normalizeConfidenceLabel(0.4)).toBe("LOW");
  });
  it("clamps score", () => {
    expect(clampScore(2)).toBe(1);
    expect(clampScore(-1)).toBe(0);
    expect(clampScore(undefined, 0.3)).toBe(0.3);
  });
});

describe("recommendation-mappers.service", () => {
  it("maps ads rows to assistant shape", () => {
    const out = mapAdsRecommendations([
      {
        action: "increase_budget",
        campaignKey: "cmp_a",
        reason: "Good",
        confidence: "high",
      },
    ]);
    expect(out[0].source).toBe("ADS");
    expect(out[0].actionType).toBe("SCALE_CAMPAIGN");
    expect(out[0].confidenceLabel).toBe("MEDIUM");
  });
  it("maps marketplace rows", () => {
    const out = mapMarketplaceDecisions([
      {
        id: "d1",
        listingId: "L1",
        decisionType: "BOOST_LISTING",
        reason: "Strong signals",
        confidence: 0.8,
        priority: "P1",
      },
    ]);
    expect(out[0].actionType).toBe("BOOST_LISTING");
  });
});

describe("conflict-resolution.service", () => {
  it("detects scale vs pause", () => {
    const recs: AssistantRecommendation[] = [
      {
        id: "1",
        source: "ADS",
        actionType: "SCALE_CAMPAIGN",
        targetId: "c1",
        title: "a",
        summary: "s",
        reason: "r",
        confidenceScore: 0.7,
        confidenceLabel: "MEDIUM",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        source: "PROFIT",
        actionType: "PAUSE_CAMPAIGN",
        targetId: "c1",
        title: "b",
        summary: "s",
        reason: "r",
        confidenceScore: 0.6,
        confidenceLabel: "MEDIUM",
        createdAt: new Date().toISOString(),
      },
    ];
    const c = detectRecommendationConflicts(recs);
    expect(c.some((x) => x.actionTypes.includes("SCALE_CAMPAIGN"))).toBe(true);
  });

  it("fraud review vs boost on same listing", () => {
    const recs: AssistantRecommendation[] = [
      {
        id: "1",
        source: "MARKETPLACE",
        actionType: "BOOST_LISTING",
        targetId: "L1",
        title: "boost",
        summary: "s",
        reason: "r",
        confidenceScore: 0.8,
        confidenceLabel: "HIGH",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        source: "MARKETPLACE",
        actionType: "REVIEW_LISTING",
        targetId: "L1",
        title: "review",
        summary: "s",
        reason: "r",
        confidenceScore: 0.7,
        confidenceLabel: "HIGH",
        blockers: ["fraud review"],
        createdAt: new Date().toISOString(),
      },
    ];
    const c = detectRecommendationConflicts(recs);
    expect(c.some((x) => x.severity === "HIGH")).toBe(true);
  });

  it("AB winner vs CRO rotation", () => {
    const recs: AssistantRecommendation[] = [
      {
        id: "1",
        source: "AB_TEST",
        actionType: "PROMOTE_EXPERIMENT_WINNER",
        targetId: "hero",
        title: "ab",
        summary: "s",
        reason: "r",
        confidenceScore: 0.6,
        confidenceLabel: "MEDIUM",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        source: "CRO",
        actionType: "UPDATE_CTA_PRIORITY",
        targetId: "hero",
        title: "cro",
        summary: "s",
        reason: "r",
        confidenceScore: 0.55,
        confidenceLabel: "MEDIUM",
        createdAt: new Date().toISOString(),
      },
    ];
    expect(detectRecommendationConflicts(recs).length).toBeGreaterThan(0);
    const winner = resolveConflictPriority(recs[0], recs[1]);
    expect(winner).not.toBeNull();
  });
});

describe("guardrail-engine.service", () => {
  it("blocks low confidence high-impact", () => {
    const r: AssistantRecommendation = {
      id: "x",
      source: "ADS",
      actionType: "SCALE_CAMPAIGN",
      title: "t",
      summary: "s",
      reason: "r",
      confidenceScore: 0.4,
      confidenceLabel: "LOW",
      metrics: { estimatedSpend: 100, cpl: 10 },
      createdAt: new Date().toISOString(),
    };
    const g = evaluateGuardrails({ recommendation: r, environment: "production" });
    expect(g.allowed).toBe(false);
  });

  it("blocks scale without spend/cpl", () => {
    const r: AssistantRecommendation = {
      id: "x",
      source: "ADS",
      actionType: "SCALE_CAMPAIGN",
      title: "t",
      summary: "s",
      reason: "r",
      confidenceScore: 0.85,
      confidenceLabel: "HIGH",
      createdAt: new Date().toISOString(),
    };
    const g = evaluateGuardrails({ recommendation: r, environment: "production" });
    expect(g.allowed).toBe(false);
  });

  it("blocks boost with fraud blockers", () => {
    const r: AssistantRecommendation = {
      id: "x",
      source: "MARKETPLACE",
      actionType: "BOOST_LISTING",
      title: "t",
      summary: "s",
      reason: "r",
      confidenceScore: 0.9,
      confidenceLabel: "HIGH",
      blockers: ["Requires fraud review"],
      createdAt: new Date().toISOString(),
    };
    const g = evaluateGuardrails({ recommendation: r, environment: "production" });
    expect(g.allowed).toBe(false);
  });
});

describe("assistant-aggregator.service", () => {
  beforeEach(() => {
    vi.mocked(loaders.getLatestAdsOperatorRecommendations).mockResolvedValue([]);
    vi.mocked(loaders.getLatestProfitRecommendations).mockResolvedValue([]);
    vi.mocked(loaders.getLatestCroRecommendations).mockResolvedValue([]);
    vi.mocked(loaders.getLatestRetargetingRecommendations).mockResolvedValue([]);
    vi.mocked(loaders.getLatestAbRecommendations).mockResolvedValue([]);
    vi.mocked(loaders.getLatestMarketplaceRecommendations).mockResolvedValue([]);
    vi.mocked(loaders.getLatestUnifiedMonitoringCard).mockResolvedValue([
      {
        id: "m1",
        source: "UNIFIED",
        actionType: "MONITOR",
        title: "mon",
        summary: "s",
        reason: "r",
        confidenceScore: 0.5,
        confidenceLabel: "MEDIUM",
        createdAt: new Date().toISOString(),
      },
    ]);
  });

  it("separates monitoring and handles empty subsystems", async () => {
    const feed = await buildAssistantRecommendationFeed({ persist: false });
    expect(feed.monitoringOnly.length).toBeGreaterThan(0);
    expect(feed.subsystemWarnings.length).toBe(0);
  });

  it("marks blocked when guardrails reject", async () => {
    vi.mocked(loaders.getLatestAdsOperatorRecommendations).mockResolvedValue([
      {
        id: "a1",
        source: "ADS",
        actionType: "SCALE_CAMPAIGN",
        title: "scale",
        summary: "s",
        reason: "r",
        confidenceScore: 0.4,
        confidenceLabel: "LOW",
        createdAt: new Date().toISOString(),
      },
    ]);
    const feed = await buildAssistantRecommendationFeed({ persist: false });
    expect(feed.blockedRecommendations.length).toBeGreaterThan(0);
  });
});
