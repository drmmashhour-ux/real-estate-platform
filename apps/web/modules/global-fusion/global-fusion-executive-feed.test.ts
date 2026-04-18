import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    globalFusionFlags: {
      ...a.globalFusionFlags,
      globalFusionExecutiveLayerV1: true,
      globalFusionExecutiveFeedV1: true,
    },
  };
});

vi.mock("./global-fusion-executive.service", async (importOriginal) => {
  const a = await importOriginal<typeof import("./global-fusion-executive.service")>();
  return {
    ...a,
    buildGlobalFusionExecutiveSummary: vi.fn(),
  };
});

import { globalFusionFlags } from "@/config/feature-flags";
import {
  buildGlobalFusionExecutiveSummary,
  buildGlobalFusionExecutiveSummaryFromAssembly,
} from "./global-fusion-executive.service";
import { buildGlobalFusionExecutiveFeed, wrapExecutiveSummaryAsFeed } from "./global-fusion-executive-feed.service";
import type { GlobalFusionExecutiveAssemblyInput, GlobalFusionPayload, GlobalFusionSnapshot } from "./global-fusion.types";

function minimalSnap(): GlobalFusionSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    opportunities: [],
    risks: [],
    recommendations: [],
    conflicts: [],
    scores: {
      fusedConfidence: 0.5,
      fusedPriority: 0.5,
      fusedRisk: 0.5,
      actionability: 0.5,
      agreementScore: 0.5,
      evidenceScore: 0.5,
    },
    signals: [],
    influence: null,
  };
}

function assembly(): GlobalFusionExecutiveAssemblyInput {
  const fusionPayload: GlobalFusionPayload = {
    enabled: true,
    snapshot: minimalSnap(),
    health: { overallStatus: "ok", observationalWarnings: [], insufficientEvidenceCount: 0, missingSourceCount: 4 },
    meta: {
      dataFreshnessMs: 1,
      sourcesUsed: [],
      missingSources: ["a", "b", "c", "d"],
      contributingSystemsCount: 0,
      normalizedSignalCount: 0,
      conflictCount: 0,
      recommendationCount: 0,
      persistenceLogged: false,
      influenceFlag: false,
      primaryFlag: false,
      influenceApplied: false,
      malformedNormalizedCount: 0,
    },
  };
  return {
    fusionPayload,
    primaryResult: null,
    monitoring: {
      runsTotal: 2,
      fallbackRate: 0.1,
      missingSourceRate: 0.4,
      conflictRate: 0.1,
      disagreementRate: 0.1,
      lowEvidenceRate: 0.1,
      anomalyRate: 0.1,
      unstableOrderingRate: 0.1,
      malformedInputRate: 0.02,
    },
    governanceSnapshot: null,
    learningSummary: null,
    learning: null,
    freezeState: { learningFrozen: false, influenceFrozen: false, reason: null, frozenAt: null },
  };
}

describe("global-fusion-executive-feed", () => {
  beforeEach(() => {
    vi.mocked(buildGlobalFusionExecutiveSummary).mockReset();
  });

  it("returns null when executive feed flag is off", async () => {
    (globalFusionFlags as { globalFusionExecutiveFeedV1: boolean }).globalFusionExecutiveFeedV1 = false;
    const feed = await buildGlobalFusionExecutiveFeed({});
    expect(feed).toBeNull();
  });

  it("wrapExecutiveSummaryAsFeed produces stable meta.feedVersion", () => {
    const summary = buildGlobalFusionExecutiveSummaryFromAssembly(assembly(), null);
    const feed = wrapExecutiveSummaryAsFeed(summary);
    expect(feed.meta.feedVersion).toBe(1);
    expect(feed.topPriorities).toBe(summary.topPriorities);
    expect(feed.warnings.length).toBeGreaterThanOrEqual(0);
  });

  it("buildGlobalFusionExecutiveFeed delegates to summary when feed flag on", async () => {
    (globalFusionFlags as { globalFusionExecutiveFeedV1: boolean }).globalFusionExecutiveFeedV1 = true;
    const summary = buildGlobalFusionExecutiveSummaryFromAssembly(assembly(), null);
    vi.mocked(buildGlobalFusionExecutiveSummary).mockResolvedValue(summary);
    const feed = await buildGlobalFusionExecutiveFeed({});
    expect(feed).not.toBeNull();
    expect(feed?.meta.executiveFeedEnabled).toBe(true);
  });
});
