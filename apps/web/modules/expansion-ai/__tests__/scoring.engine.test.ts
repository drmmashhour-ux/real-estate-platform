import { describe, expect, it } from "vitest";
import type { Market } from "../market.types";
import {
  DEFAULT_EXPANSION_WEIGHTS,
  normalizeExpansionWeights,
  riskLevelFromMarket,
  scoreMarket,
} from "../scoring.engine";

function market(partial: Partial<Market> & Pick<Market, "city" | "country">): Market {
  return {
    city: partial.city,
    country: partial.country,
    citySlug: partial.citySlug,
    population: partial.population ?? null,
    tourismDemand: partial.tourismDemand ?? null,
    realEstateActivity: partial.realEstateActivity ?? null,
    competitionLevel: partial.competitionLevel ?? null,
    regulatoryComplexity: partial.regulatoryComplexity ?? null,
    revenuePotential: partial.revenuePotential ?? null,
    dataProvenance: partial.dataProvenance ?? ["test"],
    launchStatus: partial.launchStatus,
  };
}

describe("scoreMarket", () => {
  it("scores 100 when all opportunity inputs are strongest", () => {
    const m = market({
      city: "A",
      country: "CA",
      tourismDemand: 1,
      realEstateActivity: 1,
      competitionLevel: 0,
      regulatoryComplexity: 0,
      revenuePotential: 1,
    });
    const r = scoreMarket(m, DEFAULT_EXPANSION_WEIGHTS);
    expect(r.score).toBe(100);
    expect(r.dataCoverage).toBeCloseTo(1, 5);
  });

  it("scores 0 when attractiveness inputs are minimal", () => {
    const m = market({
      city: "B",
      country: "CA",
      tourismDemand: 0,
      realEstateActivity: 0,
      competitionLevel: 1,
      regulatoryComplexity: 1,
      revenuePotential: 0,
    });
    const r = scoreMarket(m, DEFAULT_EXPANSION_WEIGHTS);
    expect(r.score).toBe(0);
  });

  it("renormalizes when demand proxies are missing", () => {
    const m = market({
      city: "C",
      country: "CA",
      tourismDemand: null,
      realEstateActivity: null,
      competitionLevel: 0,
      regulatoryComplexity: 0,
      revenuePotential: 1,
    });
    const r = scoreMarket(m, DEFAULT_EXPANSION_WEIGHTS);
    expect(r.score).toBe(100);
    expect(r.breakdown.find((b) => b.label.startsWith("Demand"))?.input).toBeNull();
  });

  it("returns null score when every factor is missing", () => {
    const m = market({
      city: "D",
      country: "CA",
      tourismDemand: null,
      realEstateActivity: null,
      competitionLevel: null,
      regulatoryComplexity: null,
      revenuePotential: null,
    });
    const r = scoreMarket(m, DEFAULT_EXPANSION_WEIGHTS);
    expect(r.score).toBeNull();
    expect(r.dataCoverage).toBe(0);
  });
});

describe("normalizeExpansionWeights", () => {
  it("rescales arbitrary positive weights to sum to 1", () => {
    const w = normalizeExpansionWeights({
      demand: 6,
      competition: 4,
      regulation: 4,
      revenuePotential: 6,
    });
    expect(w.demand + w.competition + w.regulation + w.revenuePotential).toBeCloseTo(1, 5);
    expect(w.demand).toBeCloseTo(0.3, 5);
    expect(w.competition).toBeCloseTo(0.2, 5);
    expect(w.regulation).toBeCloseTo(0.2, 5);
    expect(w.revenuePotential).toBeCloseTo(0.3, 5);
  });
});

describe("riskLevelFromMarket", () => {
  it("marks high risk when data coverage is thin", () => {
    const m = market({
      city: "E",
      country: "CA",
      tourismDemand: 1,
      realEstateActivity: null,
      competitionLevel: null,
      regulatoryComplexity: null,
      revenuePotential: null,
    });
    const sc = scoreMarket(m, DEFAULT_EXPANSION_WEIGHTS);
    expect(sc.dataCoverage).toBeLessThan(0.35);
    expect(riskLevelFromMarket(m, sc)).toBe("high");
  });
});
