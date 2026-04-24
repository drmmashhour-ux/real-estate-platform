import { logInfo } from "@/lib/logger";
import type { EsgGrade, EsgProfilePayload, EsgScoreEngineResult } from "@/modules/esg/esg.types";

const TAG = "[esg-engine]";

function gradeFromScore(score: number): EsgGrade {
  if (score >= 75) return "A";
  if (score >= 55) return "B";
  return "C";
}

function hasLeedWellBonus(cert: string | null | undefined): boolean {
  const c = (cert ?? "").trim().toUpperCase();
  if (!c || c === "NONE") return false;
  return c.includes("LEED") || c.includes("WELL");
}

/**
 * Composite ESG score from profile inputs.
 * Base: average of energy, carbon, sustainability (missing numeric → 0 in sum; energy null adds penalty flag).
 */
export function computeEsgScore(input: EsgProfilePayload): EsgScoreEngineResult {
  const flags: string[] = [];
  const e = input.energyScore;
  const c = input.carbonScore;
  const s = input.sustainabilityScore;

  if (e == null) flags.push("missing_energy_data");

  const sum = (e ?? 0) + (c ?? 0) + (s ?? 0);
  let score = sum / 3;

  if (e == null) score -= 15;
  if (input.highCarbonMaterials) {
    score -= 10;
    flags.push("high_carbon_materials");
  }
  if (input.solar) {
    score += 10;
    flags.push("solar_bonus");
  }
  if (input.renovation) {
    score += 8;
    flags.push("renovation_bonus");
  }

  const certNorm = normalizeCert(input.certification);
  if (certNorm === "LEED" || certNorm === "WELL") {
    score += 15;
    flags.push("certification_bonus");
  }

  score = Math.max(0, Math.min(100, Math.round(score * 10) / 10));
  const grade = gradeFromScore(score);

  logInfo(`${TAG} computed`, { score, grade, flagCount: flags.length });
  
  return { 
    score, 
    grade, 
    flags,
    reasoning: `Composite ESG score based on energy, carbon, and sustainability factors. Flags: ${flags.join(", ") || "none"}.`,
    confidence: e != null && c != null && s != null ? 0.9 : 0.65,
    disclaimer: "ESG-SCORE-DISCLAIMER: This score is an AI-generated estimate and not a formal environmental certification.",
  };
}

/** AI-style recommendations — advisory copy only */
export function buildEsgRecommendations(input: EsgProfilePayload, flags: string[]): string[] {
  const out: string[] = [];
  if (!input.solar) out.push("Add solar panels");
  if (!input.renovation) out.push("Prioritize renovation over new build where feasible");
  if (!hasLeedWellBonus(input.certification)) out.push("Pursue LEED or WELL certification documentation");
  if (flags.includes("missing_energy_data")) out.push("Add energy benchmarking or EnerGuide-style data");
  if (flags.includes("high_carbon_materials")) out.push("Specify lower-carbon envelope materials");
  if (out.length === 0) out.push("Maintain current ESG posture and refresh data annually");
  return [...new Set(out)].slice(0, 6);
}
