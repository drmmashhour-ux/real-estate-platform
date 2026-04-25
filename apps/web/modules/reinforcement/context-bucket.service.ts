import type { ReinforcementContextInput } from "./reinforcement.types";
import { reinforcementLog } from "./reinforcement-logger";

function bandReadiness(n: number | null | undefined, fromLabel?: string): "low" | "mid" | "high" | "unknown" {
  if (fromLabel) {
    const s = fromLabel.toLowerCase();
    if (s.includes("not_ready") || s === "low") return "low";
    if (s.includes("high") || s.includes("ready") || s.includes("intent")) return "high";
    if (s.includes("discussion") || s.includes("mid")) return "mid";
  }
  if (typeof n !== "number" || !Number.isFinite(n)) return "unknown";
  if (n < 0.35) return "low";
  if (n < 0.7) return "mid";
  return "high";
}

function bandSilence(days: number | null | undefined): ReinforcementContextInput["silenceGapBand"] {
  if (typeof days !== "number" || !Number.isFinite(days) || days < 0) return "unknown";
  if (days <= 2) return "low";
  if (days <= 7) return "mid";
  return "high";
}

function bandEngagement(score: number | null | undefined): ReinforcementContextInput["engagementBand"] {
  if (typeof score !== "number" || !Number.isFinite(score)) return "unknown";
  const s = score > 1 ? score / 100 : score;
  if (s < 0.35) return "low";
  if (s < 0.65) return "mid";
  return "high";
}

/**
 * Deterministic, coarse bucket for bandit arms — explainable, stable.
 */
export function buildStrategyContextBucket(input: ReinforcementContextInput): string {
  const stage = (input.dealStage ?? "unknown").toLowerCase().replace(/\|/g, "_").slice(0, 32);
  const cr = input.closingReadinessBand ?? "unknown";
  const or_ = input.offerReadinessBand ?? "unknown";
  const fin = input.financingReadiness ?? "unknown";
  const urg = input.urgency ?? "unknown";
  const obj = input.objectionSeverity ?? "unknown";
  const comp = input.competitionRisk ?? "unknown";
  const vis = input.visitCompleted === true ? "visit_yes" : input.visitCompleted === false ? "visit_no" : "visit_unk";
  const sg = input.silenceGapBand ?? "unknown";
  const eng = input.engagementBand ?? "unknown";

  const parts = [stage, `cr_${cr}`, `or_${or_}`, `fin_${fin}`, `urg_${urg}`, `obj_${obj}`, `comp_${comp}`, vis, `sg_${sg}`, `eng_${eng}`];
  const bucket = parts.join("|");
  reinforcementLog.contextBucket({ len: bucket.length, stage });
  return bucket.slice(0, 256);
}

/**
 * Helper: derive bands from raw numbers when labels missing.
 */
export function normalizeContextInput(
  raw: ReinforcementContextInput & {
    closingReadinessScore?: number | null;
    offerReadinessScore?: number | null;
    silenceGapDays?: number | null;
    engagementScore?: number | null;
  }
): ReinforcementContextInput {
  return {
    ...raw,
    closingReadinessBand: raw.closingReadinessBand ?? bandReadiness(raw.closingReadinessScore),
    offerReadinessBand: raw.offerReadinessBand ?? bandReadiness(raw.offerReadinessScore),
    silenceGapBand: raw.silenceGapBand ?? bandSilence(raw.silenceGapDays),
    engagementBand: raw.engagementBand ?? bandEngagement(raw.engagementScore),
  };
}
