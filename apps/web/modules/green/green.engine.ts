import type { GreenEngineInput, GreenEngineOutput, GreenImprovement } from "./green.types";
import { esgUpgradeLog } from "./green-logger";

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function baselineFromYear(yearBuilt: number | null | undefined): number {
  if (yearBuilt == null || yearBuilt <= 0) return 42;
  const age = new Date().getFullYear() - yearBuilt;
  if (age <= 5) return 58;
  if (age <= 20) return 48;
  if (age <= 40) return 40;
  return 34;
}

/**
 * Deterministic internal ESG-style score (0–100). Not an EnerGuide / government label.
 */
export function evaluateGreenEngine(input: GreenEngineInput): GreenEngineOutput {
  let score = baselineFromYear(input.yearBuilt);

  const heat = (input.heatingType ?? "").toLowerCase();
  if (heat.includes("heat pump") || input.hasHeatPump) score += 14;
  else if (heat.includes("electric") && !heat.includes("baseboard")) score += 6;
  else if (heat.includes("gas") || heat.includes("oil")) score -= 4;

  switch (input.insulationQuality) {
    case "good":
      score += 10;
      break;
    case "average":
      score += 4;
      break;
    case "poor":
      score -= 6;
      break;
    default:
      break;
  }

  switch (input.windowsQuality) {
    case "triple_high_performance":
      score += 12;
      break;
    case "double":
      score += 6;
      break;
    case "single":
      score -= 5;
      break;
    default:
      break;
  }

  if (input.solarPvKw != null && input.solarPvKw > 0) {
    score += Math.min(12, 4 + input.solarPvKw * 2);
  }

  if (input.envelopeRetrofitYearsAgo != null && input.envelopeRetrofitYearsAgo <= 8) {
    score += 8;
  }

  score = clampScore(score);

  const improvements = buildImprovements(input, score);
  const targetScore = clampScore(Math.max(score + 18, 72));

  esgUpgradeLog.info("green_engine_evaluated", {
    score,
    targetScore,
    improvementsCount: improvements.length,
  });

  return { currentScore: score, targetScore, improvements };
}

function buildImprovements(input: GreenEngineInput, current: number): GreenImprovement[] {
  const list: GreenImprovement[] = [];

  if (input.insulationQuality !== "good") {
    list.push({
      action: "Upgrade attic & wall insulation (target R-value for your climate)",
      impact: "HIGH",
      estimatedCostLabel: "Varies by assembly — typically mid-to-high four figures",
      expectedGainPoints: 15,
    });
  }

  if (input.windowsQuality !== "triple_high_performance" && input.windowsQuality !== "double") {
    list.push({
      action: "Replace or upgrade windows (high-performance glazing / frames)",
      impact: "HIGH",
      estimatedCostLabel: "Often mid four figures+ depending on openings",
      expectedGainPoints: 12,
    });
  }

  if (!input.hasHeatPump && !String(input.heatingType ?? "").toLowerCase().includes("heat pump")) {
    list.push({
      action: "Cold-climate heat pump for heating & cooling",
      impact: "HIGH",
      estimatedCostLabel: "Equipment + install — obtain multiple quotes",
      expectedGainPoints: 14,
    });
  }

  if (input.solarPvKw == null || input.solarPvKw <= 0) {
    list.push({
      action: "Add right-sized solar PV (grid-tied) where roof/site allows",
      impact: "MEDIUM",
      estimatedCostLabel: "Highly site-dependent",
      expectedGainPoints: 10,
    });
  }

  list.push({
    action: "Air sealing + controlled ventilation (HRV/ERV where applicable)",
    impact: "MEDIUM",
    estimatedCostLabel: "Often low-to-mid four figures",
    expectedGainPoints: 8,
  });

  if (current < 55) {
    list.push({
      action: "Smart thermostats & zoning / hydronic balancing",
      impact: "LOW",
      estimatedCostLabel: "Lower incremental cost",
      expectedGainPoints: 4,
    });
  }

  return list.slice(0, 8);
}

/** Simulates picking improvements — diminishing returns so users cannot exceed 100 trivially. */
export function projectScoreAfterSelections(baseInput: GreenEngineInput, selected: GreenImprovement[]): number {
  const base = evaluateGreenEngine(baseInput).currentScore;
  const bonus = selected.reduce((sum, imp) => sum + imp.expectedGainPoints * 0.55, 0);
  return clampScore(base + bonus);
}

/** Same projection curve anchored to an explicit Québec ESG score (LECIPM AI Green Score driver). */
export function projectScoreFromQuebecBase(baseScore: number, selected: GreenImprovement[]): number {
  const bonus = selected.reduce((sum, imp) => sum + imp.expectedGainPoints * 0.55, 0);
  return clampScore(baseScore + bonus);
}
