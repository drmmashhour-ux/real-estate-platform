/**
 * Québec-inspired weighted ESG-style model — illustrative only.
 * Does not replicate or replace Rénoclimat, EnerGuide, or municipal programs.
 */

import type { GreenEngineInput } from "@/modules/green/green.types";
import { greenAiLog } from "./green-ai-logger";

export const QUEBEC_ESG_CRITERIA_DISCLAIMER =
  "Based on Québec-inspired criteria. Not an official Rénoclimat evaluation.";

export type QuebecEsgLabel = "GREEN" | "STANDARD" | "LOW";

export type QuebecEsgBreakdown = {
  heating: number;
  insulation: number;
  windows: number;
  energyEfficiency: number;
  materials: number;
  water: number;
  bonus: number;
};

export type QuebecEsgResult = {
  score: number;
  label: QuebecEsgLabel;
  breakdown: QuebecEsgBreakdown;
  improvementAreas: string[];
};

/** Category weights — sum = 100% */
const W = {
  heating: 0.25,
  insulation: 0.2,
  windows: 0.15,
  energyEfficiency: 0.15,
  materials: 0.1,
  water: 0.05,
  bonus: 0.1,
} as const;

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function insulationBandScore(q: "poor" | "average" | "good" | "unknown" | undefined): number {
  switch (q ?? "unknown") {
    case "good":
      return 88;
    case "average":
      return 58;
    case "poor":
      return 30;
    default:
      return 48;
  }
}

function scoreHeating(input: GreenEngineInput): number {
  if (input.hasHeatPump === true) return 94;
  const h = (input.heatingType ?? "").toLowerCase();
  if (h.includes("heat pump") || h.includes("thermopompe")) return 94;
  if (h.includes("oil") || h.includes("huile") || h.includes("fioul")) return 26;
  if (h.includes("gas") || h.includes("gaz") || h.includes("propane")) return 44;
  if (h.includes("baseboard") || h.includes("plinthe")) return 56;
  if (h.includes("electric") || h.includes("électrique")) return 64;
  if (h.includes("wood") || h.includes("bois") || h.includes("biomass")) return 52;
  return 46;
}

function scoreInsulation(input: GreenEngineInput): number {
  const attic = insulationBandScore(input.atticInsulationQuality ?? input.insulationQuality);
  const wall = insulationBandScore(input.wallInsulationQuality ?? input.insulationQuality);
  return clamp((attic + wall) / 2);
}

function scoreWindows(input: GreenEngineInput): number {
  switch (input.windowsQuality ?? "unknown") {
    case "triple_high_performance":
      return 94;
    case "double":
      return 72;
    case "single":
      return 34;
    default:
      return 52;
  }
}

function inferEnergyWhenUnknown(input: GreenEngineInput): number {
  let s = 52;
  const y = input.yearBuilt;
  if (y != null && y > 0) {
    const age = new Date().getFullYear() - y;
    if (age <= 12) s += 14;
    else if (age <= 30) s += 4;
    else s -= 10;
  }
  if (input.insulationQuality === "good" && input.windowsQuality === "triple_high_performance") s += 8;
  if (input.insulationQuality === "poor") s -= 10;
  return clamp(s);
}

function scoreEnergyEfficiency(input: GreenEngineInput): number {
  switch (input.energyConsumptionBand ?? "unknown") {
    case "low":
      return 90;
    case "moderate":
      return 62;
    case "high":
      return 34;
    default:
      return inferEnergyWhenUnknown(input);
  }
}

function scoreMaterials(input: GreenEngineInput): number {
  switch (input.materialsProfile ?? "unknown") {
    case "sustainable":
      return 86;
    case "standard":
      return 54;
    default:
      return 50;
  }
}

function scoreWater(input: GreenEngineInput): number {
  switch (input.waterEfficiency ?? "unknown") {
    case "high":
      return 84;
    case "average":
      return 58;
    case "low":
      return 34;
    default:
      return 52;
  }
}

/** Montréal-friendly bonus: green roof + solar PV */
function scoreBonus(input: GreenEngineInput): number {
  let s = 44;
  if (input.hasGreenRoof === true) s += 26;
  const kw = input.solarPvKw;
  if (kw != null && kw > 0) {
    s += Math.min(32, 6 + kw * 2.4);
  }
  return clamp(s);
}

const FACTOR_LABEL: Record<keyof QuebecEsgBreakdown, string> = {
  heating: "Heating system",
  insulation: "Insulation (attic & walls)",
  windows: "Windows & glazing",
  energyEfficiency: "Energy use intensity",
  materials: "Materials",
  water: "Water efficiency",
  bonus: "Green roof / renewables",
};

const THRESHOLD_WEAK = 56;

function collectImprovementAreas(breakdown: QuebecEsgBreakdown): string[] {
  const entries = (Object.keys(breakdown) as (keyof QuebecEsgBreakdown)[])
    .map((key) => ({ key, score: breakdown[key], label: FACTOR_LABEL[key] }))
    .filter((e) => e.score < THRESHOLD_WEAK)
    .sort((a, b) => a.score - b.score);

  const primary = entries.slice(0, 4).map((e) => e.label);
  return primary.length > 0 ? primary : ["Fine-tune envelope + HVAC details for higher precision"];
}

function performanceLabel(score: number): QuebecEsgLabel {
  if (score >= 72) return "GREEN";
  if (score >= 48) return "STANDARD";
  return "LOW";
}

/**
 * Weighted Québec-market-oriented ESG score (0–100) with per-factor breakdown.
 */
export function evaluateQuebecEsg(input: GreenEngineInput): QuebecEsgResult {
  const breakdown: QuebecEsgBreakdown = {
    heating: clamp(scoreHeating(input)),
    insulation: scoreInsulation(input),
    windows: clamp(scoreWindows(input)),
    energyEfficiency: scoreEnergyEfficiency(input),
    materials: scoreMaterials(input),
    water: scoreWater(input),
    bonus: scoreBonus(input),
  };

  const score = clamp(
    W.heating * breakdown.heating +
      W.insulation * breakdown.insulation +
      W.windows * breakdown.windows +
      W.energyEfficiency * breakdown.energyEfficiency +
      W.materials * breakdown.materials +
      W.water * breakdown.water +
      W.bonus * breakdown.bonus,
  );

  const label = performanceLabel(score);
  const improvementAreas = collectImprovementAreas(breakdown);

  greenAiLog.info("quebec_esg_evaluated", {
    score,
    label,
    weakest: improvementAreas[0],
  });

  return { score, label, breakdown, improvementAreas };
}
