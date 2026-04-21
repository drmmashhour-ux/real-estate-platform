/**
 * Illustrative Rénoclimat-style incentive ranges — not quotes from any live program.
 */

import type { GreenEngineInput } from "@/modules/green/green.types";

export const RENOCLIMAT_GRANT_ESTIMATE_DISCLAIMER =
  "Estimated values based on public program ranges. I cannot confirm exact amounts.";

export type RenoclimatGrantBreakdownItem = {
  upgrade: string;
  /** Display band e.g. "$500–$3000" or "~$150/window" */
  amount: string;
  /** Midpoint CAD for aggregation only */
  estimatedCadMid: number;
};

export type RenoclimatGrantEstimate = {
  estimatedGrant: number;
  breakdown: RenoclimatGrantBreakdownItem[];
  disclaimer: typeof RENOCLIMAT_GRANT_ESTIMATE_DISCLAIMER;
  /** Optional: grants ÷ property value when value known — for ROI-style context */
  grantToPropertyValueRatio: number | null;
};

export type RenoclimatGrantCalculatorInput = {
  /** Green engine improvement lines or user-selected actions */
  upgradeActions: string[];
  propertyDetails?: {
    surfaceSqft?: number | null;
    windowCount?: number | null;
    propertyValueMajor?: number | null;
  };
};

const INSULATION_BAND = { min: 500, max: 3000, label: "$500–$3000" };
const AIRTIGHT_BAND = { min: 400, max: 800, label: "$400–$800" };
const WINDOW_PER_UNIT = { perWindow: 150, label: "~$150/window (illustrative)" };
const HEAT_PUMP_BAND = { min: 3000, max: 12000, label: "$$$ (high incentive — equipment class dependent)" };

function mid(a: number, b: number): number {
  return Math.round((a + b) / 2);
}

function inferWindowCount(details: RenoclimatGrantCalculatorInput["propertyDetails"]): number {
  const explicit = details?.windowCount;
  if (explicit != null && explicit > 0) return Math.min(40, Math.round(explicit));
  const sq = details?.surfaceSqft;
  if (sq != null && sq > 0) return Math.min(30, Math.max(6, Math.round(sq / 130)));
  return 10;
}

function classifyAction(action: string): Set<string> {
  const a = action.toLowerCase();
  const tags = new Set<string>();
  if (a.includes("insulation") || a.includes("attic") || a.includes("wall") || a.includes("envelope")) tags.add("insulation");
  if (a.includes("window") || a.includes("glazing")) tags.add("windows");
  if (a.includes("air sealing") || a.includes("air seal") || a.includes("airtight")) tags.add("airtightness");
  if (a.includes("heat pump") || a.includes("thermopompe")) tags.add("heat_pump");
  if (a.includes("hrv") || a.includes("erv") || a.includes("ventilation")) tags.add("ventilation");
  if (a.includes("solar") || a.includes("pv")) tags.add("solar");
  return tags;
}

function aggregateTags(actions: string[]): Set<string> {
  const all = new Set<string>();
  for (const line of actions) {
    for (const t of classifyAction(line)) all.add(t);
  }
  return all;
}

/**
 * Sums illustrative incentive midpoints by matched upgrade category.
 */
export function estimateRenoclimatGrants(input: RenoclimatGrantCalculatorInput): RenoclimatGrantEstimate {
  const tags = aggregateTags(input.upgradeActions);
  const breakdown: RenoclimatGrantBreakdownItem[] = [];

  if (tags.has("insulation")) {
    breakdown.push({
      upgrade: "Insulation upgrade",
      amount: INSULATION_BAND.label,
      estimatedCadMid: mid(INSULATION_BAND.min, INSULATION_BAND.max),
    });
  }
  if (tags.has("airtightness")) {
    breakdown.push({
      upgrade: "Airtightness / blower-door guided sealing",
      amount: AIRTIGHT_BAND.label,
      estimatedCadMid: mid(AIRTIGHT_BAND.min, AIRTIGHT_BAND.max),
    });
  }
  if (tags.has("windows")) {
    const n = inferWindowCount(input.propertyDetails);
    const totalMid = n * WINDOW_PER_UNIT.perWindow;
    breakdown.push({
      upgrade: "Windows (per opening)",
      amount: `${WINDOW_PER_UNIT.label} × ~${n} openings`,
      estimatedCadMid: totalMid,
    });
  }
  if (tags.has("heat_pump")) {
    breakdown.push({
      upgrade: "Cold-climate heat pump",
      amount: HEAT_PUMP_BAND.label,
      estimatedCadMid: mid(HEAT_PUMP_BAND.min, HEAT_PUMP_BAND.max),
    });
  }
  if (tags.has("ventilation")) {
    breakdown.push({
      upgrade: "Ventilation (HRV/ERV)",
      amount: "$800–$2500",
      estimatedCadMid: mid(800, 2500),
    });
  }
  if (tags.has("solar")) {
    breakdown.push({
      upgrade: "Solar PV (when bundled / eligible)",
      amount: "$1000–$5000",
      estimatedCadMid: mid(1000, 5000),
    });
  }

  const estimatedGrant = Math.round(breakdown.reduce((s, r) => s + r.estimatedCadMid, 0));

  const v = input.propertyDetails?.propertyValueMajor;
  const grantToPropertyValueRatio =
    v != null && v > 0 && estimatedGrant > 0 ? Math.round((estimatedGrant / v) * 10000) / 10000 : null;

  return {
    estimatedGrant,
    breakdown,
    disclaimer: RENOCLIMAT_GRANT_ESTIMATE_DISCLAIMER,
    grantToPropertyValueRatio,
  };
}

/** Build synthetic upgrade lines from green intake when no explicit list exists */
export function syntheticUpgradesFromProperty(input: GreenEngineInput): string[] {
  const lines: string[] = [];
  if (input.insulationQuality === "poor" || input.insulationQuality === "average" || input.insulationQuality === "unknown") {
    lines.push("Upgrade attic & wall insulation (target R-value for your climate)");
  }
  if (input.windowsQuality === "single" || input.windowsQuality === "unknown") {
    lines.push("Replace or upgrade windows (high-performance glazing / frames)");
  }
  if (!input.hasHeatPump && !(input.heatingType ?? "").toLowerCase().includes("heat pump")) {
    lines.push("Cold-climate heat pump for heating & cooling");
  }
  lines.push("Air sealing + controlled ventilation (HRV/ERV where applicable)");
  if (input.solarPvKw != null && input.solarPvKw <= 0) {
    lines.push("Add right-sized solar PV (grid-tied) where roof/site allows");
  }
  return lines;
}
