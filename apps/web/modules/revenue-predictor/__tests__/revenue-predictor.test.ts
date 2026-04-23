import { describe, it, expect, beforeEach } from "vitest";

import { resetAiSalesStoreForTests } from "@/modules/ai-sales-manager/ai-sales-manager-storage";
import { updateSalesProfileFromTraining } from "@/modules/ai-sales-manager/ai-sales-profile.service";

import { STAGE_CLOSE_WEIGHT } from "../revenue-predictor.config";
import { evaluateRevenuePredictorAlerts } from "../revenue-predictor-alerts.service";
import {
  buildCoachingUpliftForecast,
  buildForecastRangesCents,
  computeBaseExpectedRevenueCents,
  computeWeightedCloseProbability,
  effectiveStageCloseWeight,
} from "../revenue-predictor-forecast.service";
import { buildSalespersonExplainability } from "../revenue-predictor-explainability.service";
import {
  buildSalespersonPredictorInput,
  saveRevenueFinancialSnapshot,
} from "../revenue-predictor-inputs.service";
import { estimateOpportunityLoss } from "../revenue-predictor-opportunity-loss.service";
import { buildOrganizationRevenueRollup } from "../revenue-predictor.service";
import { resetRevenuePredictorStoreForTests } from "../revenue-predictor-storage";

beforeEach(() => {
  resetRevenuePredictorStoreForTests();
  resetAiSalesStoreForTests();
});

describe("stage weights & probability", () => {
  it("has monotonic-ish stage weights for open funnel", () => {
    expect(STAGE_CLOSE_WEIGHT.QUALIFIED).toBeGreaterThan(STAGE_CLOSE_WEIGHT.DEMO_SCHEDULED);
  });

  it("computes weighted close probability within bounds", () => {
    updateSalesProfileFromTraining("u1", {
      scenarioId: "broker-cold-driver-easy",
      avgScore: 72,
      controlScore: 70,
      closingScore: 68,
      won: true,
      personality: "DRIVER",
      scenarioAudience: "BROKER",
      difficulty: "EASY",
    });
    saveRevenueFinancialSnapshot({
      userId: "u1",
      pipelineValueCents: 500_000_00,
      averageDealValueCents: 50_000_00,
      openDeals: 4,
      conversionByStage: { QUALIFIED: 2, DEMO_SCHEDULED: 2 },
    });
    const inp = buildSalespersonPredictorInput("u1");
    const p = computeWeightedCloseProbability(inp);
    expect(p).toBeGreaterThanOrEqual(0.04);
    expect(p).toBeLessThanOrEqual(0.78);
    const st = effectiveStageCloseWeight(inp);
    expect(st).toBeGreaterThan(0.07);
  });
});

describe("forecast & ranges", () => {
  it("builds ranges around base", () => {
    const r = buildForecastRangesCents(100_000_00);
    expect(r.conservativeCents).toBeLessThan(r.baseCents);
    expect(r.upsideCents).toBeGreaterThan(r.baseCents);
  });

  it("rollup aggregates reps", () => {
    updateSalesProfileFromTraining("a", {
      scenarioId: "broker-cold-driver-easy",
      avgScore: 75,
      controlScore: 72,
      closingScore: 70,
      won: true,
      personality: "DRIVER",
      scenarioAudience: "BROKER",
      difficulty: "EASY",
    });
    saveRevenueFinancialSnapshot({
      userId: "a",
      pipelineValueCents: 200_000_00,
      averageDealValueCents: 40_000_00,
      openDeals: 3,
      conversionByStage: { QUALIFIED: 3 },
    });
    const rollup = buildOrganizationRevenueRollup();
    expect(rollup.totalForecastBaseCents).toBeGreaterThanOrEqual(0);
    expect(rollup.repCount).toBeGreaterThanOrEqual(1);
  });
});

describe("explainability & uplift", () => {
  it("returns explainability with confidence", () => {
    updateSalesProfileFromTraining("u2", {
      scenarioId: "broker-skeptical-hard",
      avgScore: 66,
      controlScore: 60,
      closingScore: 55,
      won: false,
      personality: "ANALYTICAL",
      scenarioAudience: "BROKER",
      difficulty: "HARD",
    });
    saveRevenueFinancialSnapshot({
      userId: "u2",
      pipelineValueCents: 120_000_00,
      averageDealValueCents: 30_000_00,
      openDeals: 2,
      conversionByStage: { NEW_LEAD: 2 },
    });
    const inp = buildSalespersonPredictorInput("u2");
    const w = computeWeightedCloseProbability(inp);
    const exp = buildSalespersonExplainability(inp, w);
    expect(["LOW", "MEDIUM", "HIGH"]).toContain(exp.confidenceLabel);

    const base = computeBaseExpectedRevenueCents(inp, w);
    const uplift = buildCoachingUpliftForecast(inp, base);
    expect(uplift.potentialUpliftCents).toBeGreaterThanOrEqual(0);
    expect(uplift.narrative.length).toBeGreaterThan(10);
  });
});

describe("opportunity loss", () => {
  it("estimates loss drivers when pipeline exists", () => {
    updateSalesProfileFromTraining("u3", {
      scenarioId: "broker-follow-amiable-med",
      avgScore: 62,
      controlScore: 54,
      closingScore: 52,
      won: false,
      personality: "AMIABLE",
      scenarioAudience: "BROKER",
      difficulty: "MEDIUM",
    });
    saveRevenueFinancialSnapshot({
      userId: "u3",
      pipelineValueCents: 900_000_00,
      averageDealValueCents: 45_000_00,
      openDeals: 6,
      conversionByStage: { CONTACTED: 6 },
    });
    const inp = buildSalespersonPredictorInput("u3");
    const loss = estimateOpportunityLoss(inp);
    expect(loss.estimatedLostRevenueCents).toBeGreaterThan(0);
    expect(loss.topLossDrivers.length).toBeGreaterThan(0);
  });
});

describe("alerts", () => {
  it("runs alert evaluation without throwing", () => {
    const alerts = evaluateRevenuePredictorAlerts();
    expect(Array.isArray(alerts)).toBe(true);
  });
});
