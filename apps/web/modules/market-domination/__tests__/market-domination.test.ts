import { describe, expect, it, beforeEach } from "vitest";

import { computeHubPenetration } from "@/modules/market-domination/market-penetration.service";
import { analyzeMarketGaps } from "@/modules/market-domination/market-gap-analysis.service";
import { scoreExpansionReadiness } from "@/modules/market-domination/market-expansion-readiness.service";
import {
  competitorPressureScore,
  resetCompetitorStoreForTests,
  upsertCompetitor,
} from "@/modules/market-domination/market-competitor-tracking.service";
import { prioritizeMarkets } from "@/modules/market-domination/market-prioritization.service";
import {
  computeTerritoryDomination,
  defaultSeedTerritories,
  resetMarketDominationStateForTests,
  buildMarketDominationSnapshot,
} from "@/modules/market-domination/market-domination.service";
import { explainTerritoryScore } from "@/modules/market-domination/market-domination-explainability.service";

describe("market-domination", () => {
  beforeEach(() => {
    resetMarketDominationStateForTests();
    resetCompetitorStoreForTests();
  });

  it("computes penetration bands ordered by hub rules", () => {
    const territories = defaultSeedTerritories();
    const t = territories[0]!;
    const pen = computeHubPenetration(t.metrics);
    expect(pen.length).toBe(6);
    expect(pen.every((p) => p.band && p.score >= 0 && p.score <= 1)).toBe(true);
  });

  it("detects market gaps with sorted severity", () => {
    const territories = defaultSeedTerritories();
    const gaps = analyzeMarketGaps(territories);
    expect(Array.isArray(gaps)).toBe(true);
    const rank = { critical: 3, important: 2, watch: 1 };
    for (let i = 1; i < gaps.length; i++) {
      expect(rank[gaps[i - 1]!.severity]).toBeGreaterThanOrEqual(rank[gaps[i]!.severity]);
    }
  });

  it("scores expansion readiness in 0–100 with a band", () => {
    const t = defaultSeedTerritories()[0]!;
    const r = scoreExpansionReadiness(t);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(["NOT_READY", "EMERGING", "READY", "PRIORITY"]).toContain(r.band);
  });

  it("computes competitor pressure bounded 0–10", () => {
    upsertCompetitor({
      name: "Test Portal",
      territoryId: "mtl-core",
      category: "LISTING_PLATFORM",
      perceivedStrength: 7,
    });
    const p = competitorPressureScore([
      {
        id: "x",
        name: "Test Portal",
        territoryId: "mtl-core",
        category: "LISTING_PLATFORM",
        perceivedStrength: 7,
      },
    ]);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(10);
  });

  it("prioritizes markets in descending priorityScore", () => {
    const territories = defaultSeedTerritories();
    const readiness: Record<string, ReturnType<typeof scoreExpansionReadiness>> = {};
    const domination: Record<string, ReturnType<typeof computeTerritoryDomination>> = {};
    const competitorViews: Record<string, import("@/modules/market-domination/market-domination.types").CompetitorPressureView> =
      {};

    for (const t of territories) {
      const pen = computeHubPenetration(t.metrics);
      const avg = pen.reduce((s, x) => s + x.score, 0) / pen.length;
      readiness[t.id] = scoreExpansionReadiness(t);
      domination[t.id] = computeTerritoryDomination(t, avg);
      competitorViews[t.id] = {
        territoryId: t.id,
        pressureScore: 4,
        attackAngles: [],
        weaknessZones: [],
      };
    }

    const ranked = prioritizeMarkets(territories, readiness, domination, competitorViews);
    expect(ranked.length).toBe(territories.length);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1]!.priorityScore).toBeGreaterThanOrEqual(ranked[i]!.priorityScore);
      expect(ranked[i - 1]!.rank).toBeLessThan(ranked[i]!.rank);
    }
  });

  it("computes domination score within 0–100", () => {
    const t = defaultSeedTerritories()[0]!;
    const pen = computeHubPenetration(t.metrics);
    const avg = pen.reduce((s, x) => s + x.score, 0) / pen.length;
    const d = computeTerritoryDomination(t, avg);
    expect(d.score).toBeGreaterThanOrEqual(0);
    expect(d.score).toBeLessThanOrEqual(100);
    expect(["up", "flat", "down"]).toContain(d.trend);
  });

  it("builds explainability with leading hub", () => {
    const t = defaultSeedTerritories()[0]!;
    const pen = computeHubPenetration(t.metrics);
    const avg = pen.reduce((s, x) => s + x.score, 0) / pen.length;
    const dom = computeTerritoryDomination(t, avg);
    const ex = explainTerritoryScore(t, dom, pen);
    expect(ex.territoryId).toBe(t.id);
    expect(ex.leadingHub).toBeTruthy();
    expect(ex.scoreDrivers.length).toBeGreaterThan(0);
  });

  it("snapshot aggregates without throwing", () => {
    const snap = buildMarketDominationSnapshot();
    expect(snap.territories.length).toBeGreaterThan(0);
    expect(snap.recommendations.length).toBeGreaterThan(0);
  });
});
