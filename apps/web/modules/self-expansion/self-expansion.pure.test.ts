import { describe, expect, it } from "vitest";

import { buildEntryStrategy } from "@/modules/self-expansion/self-expansion-entry-strategy.service";
import {
  mapTerritoryExpansionProfile,
  regulatoryFlagsForTerritory,
} from "@/modules/self-expansion/self-expansion.engine";
import { summarizeLearningPatterns } from "@/modules/self-expansion/self-expansion-learning.service";
import { buildPhasePlan } from "@/modules/self-expansion/self-expansion-phasing.service";
import { buildTerritoryRecommendationDraft } from "@/modules/self-expansion/self-expansion-recommendation.service";
import { scoreTerritoryExpansion } from "@/modules/self-expansion/self-expansion-territory-scoring.service";
import {
  buildMarketDominationSnapshot,
  defaultSeedTerritories,
} from "@/modules/market-domination/market-domination.service";

describe("scoreTerritoryExpansion", () => {
  it("returns bounded score", () => {
    const dom = buildMarketDominationSnapshot();
    const t = dom.territories[0]!;
    const p = mapTerritoryExpansionProfile({ territory: t, dom, thinDataWarnings: [] });
    const s = scoreTerritoryExpansion(p, null);
    expect(s.expansionScore).toBeGreaterThanOrEqual(0);
    expect(s.expansionScore).toBeLessThanOrEqual(100);
    expect(s.confidence).toBeGreaterThan(0);
    expect(s.confidence).toBeLessThanOrEqual(1);
  });
});

describe("buildEntryStrategy", () => {
  it("selects a primary hub", () => {
    const dom = buildMarketDominationSnapshot();
    const t = dom.territories.find((x) => x.id === "old-mtl") ?? dom.territories[0]!;
    const p = mapTerritoryExpansionProfile({ territory: t, dom, thinDataWarnings: [] });
    const e = buildEntryStrategy(p);
    expect(e.entryHub).toBeTruthy();
    expect(e.firstActions.length).toBeGreaterThan(0);
  });
});

describe("buildPhasePlan", () => {
  it("maps PAUSE to DISCOVERY", () => {
    const dom = buildMarketDominationSnapshot();
    const t = dom.territories[0]!;
    const p = mapTerritoryExpansionProfile({ territory: t, dom, thinDataWarnings: [] });
    const plan = buildPhasePlan({ territory: p, actionBand: "PAUSE" });
    expect(plan.currentSuggestedPhase).toBe("DISCOVERY");
  });
});

describe("recommendation draft", () => {
  it("includes explanation fields", async () => {
    const dom = buildMarketDominationSnapshot();
    const t = dom.territories[0]!;
    const p = mapTerritoryExpansionProfile({ territory: t, dom, thinDataWarnings: [] });
    const ctx = {
      generatedAt: new Date().toISOString(),
      territories: [p],
      marketDominationGeneratedAt: dom.generatedAtIso,
      aiCeo: { thinDataWarnings: [], executiveRisk: null },
      revenuePredictor: {
        generatedAtIso: new Date().toISOString(),
        totalForecastBaseCents: 0,
        repCount: 0,
        biggestLeakCents: 0,
        biggestUpsideCents: 0,
      },
      growthBrainTopRegion: null,
      regulatoryDisclaimer: "test",
      thinDataWarnings: [],
    };
    const d = buildTerritoryRecommendationDraft(p, ctx, null, null);
    expect(d.explanation.whyPrioritized.length).toBeGreaterThan(10);
    expect(d.scoreBreakdown.strengths.length + d.scoreBreakdown.blockers.length).toBeGreaterThan(0);
  });
});

describe("learning summarize", () => {
  it("orders hubs by lift", () => {
    const s = summarizeLearningPatterns({
      hubLift: { BNHUB: 1.1, BROKER: 1.02 },
      blockerPenalty: { a: 1.2 },
      archetypeLift: { metro_core: 1.05 },
    });
    expect(s.bestEntryStrategies[0]?.hub).toBe("BNHUB");
  });
});

describe("regulatoryFlagsForTerritory", () => {
  it("includes configurable extra flags from env", () => {
    const prev = process.env.SELF_EXPANSION_EXTRA_REG_FLAGS;
    process.env.SELF_EXPANSION_EXTRA_REG_FLAGS = "test_flag";
    const t = defaultSeedTerritories()[0]!;
    const flags = regulatoryFlagsForTerritory(t);
    expect(flags.some((f) => f.includes("test_flag"))).toBe(true);
    process.env.SELF_EXPANSION_EXTRA_REG_FLAGS = prev;
  });
});
