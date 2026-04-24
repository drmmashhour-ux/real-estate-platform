import { createHash } from "node:crypto";
import { getDomainModule } from "@/modules/playbook-domains/shared/domain-registry";
import { sha256Hex, stableStringify } from "./playbook-memory-fingerprint";

function hash256To01(seedInput: string): number {
  const h = createHash("sha256").update(seedInput, "utf8").digest();
  return h.readUInt32BE(0) / 0x1_0000_0000;
}

const DEFAULT_EXPLORATION_RATE = 0.15;

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * Perceived reward from any realized fields present; missing values are not guessed.
 * Bounded in [0,1] using only provided numerics.
 */
export function computeReward(params: {
  realizedValue?: number | null;
  realizedRevenue?: number | null;
  realizedConversion?: number | null;
}): number {
  const parts: number[] = [];
  if (params.realizedRevenue != null && Number.isFinite(params.realizedRevenue)) {
    const v = Math.log1p(Math.max(0, params.realizedRevenue));
    parts.push(clamp01(v / 18));
  }
  if (params.realizedValue != null && Number.isFinite(params.realizedValue)) {
    const v = Math.log1p(Math.max(0, Math.abs(params.realizedValue)));
    parts.push(clamp01(v / 20));
  }
  if (params.realizedConversion != null && Number.isFinite(params.realizedConversion)) {
    const c = params.realizedConversion > 1 ? params.realizedConversion / 100 : params.realizedConversion;
    parts.push(clamp01(c));
  }
  if (parts.length === 0) return 0;
  return clamp01(parts.reduce((a, b) => a + b, 0) / parts.length);
}

/**
 * Per-domain reward when a module is registered; otherwise `computeReward` (same numerics, never throws).
 */
export function resolveRewardForDomain(
  domain: string,
  params: {
    realizedValue?: number | null;
    realizedRevenue?: number | null;
    realizedConversion?: number | null;
    realizedRiskScore?: number | null;
  },
): number {
  try {
    const mod = getDomainModule(String(domain));
    if (mod) {
      const r = mod.computeReward({
        realizedValue: params.realizedValue ?? undefined,
        realizedRevenue: params.realizedRevenue ?? undefined,
        realizedConversion: params.realizedConversion ?? undefined,
        riskScore: params.realizedRiskScore ?? undefined,
      });
      if (r != null && Number.isFinite(r)) {
        return clamp01(r);
      }
    }
  } catch {
    // fall back
  }
  return computeReward({
    realizedValue: params.realizedValue,
    realizedRevenue: params.realizedRevenue,
    realizedConversion: params.realizedConversion,
  });
}

/**
 * UCB-style uncertainty from impression count: higher when we have not seen many events.
 * Bounded, deterministic.
 */
export function computeUncertaintyBonus(impressions: number): number {
  if (impressions <= 0) return 1;
  if (impressions < 3) return 0.8;
  if (impressions < 10) return 0.55;
  if (impressions < 30) return 0.35;
  if (impressions < 100) return 0.2;
  return 0.1;
}

/** [0,1) from a stable string. */
export function stableHashToUnitInterval(seedInput: string): number {
  return hash256To01(seedInput);
}

export function computeExplorationDecision(
  seedInput: string,
  explorationRate: number = DEFAULT_EXPLORATION_RATE,
): boolean {
  const r = Math.max(0, Math.min(1, explorationRate));
  const p = stableHashToUnitInterval(seedInput);
  return p < r;
}

export function computeSelectionScore(params: {
  recommendationScore: number;
  meanReward: number;
  /** 0..1, typically from `computeUncertaintyBonus` */
  uncertaintyBonus: number;
}): number {
  const m = Math.max(0, Math.min(1, params.meanReward));
  const rec = Math.max(0, Math.min(1, params.recommendationScore));
  const u = Math.max(0, Math.min(1, params.uncertaintyBonus));
  return clamp01(rec * 0.45 + m * 0.35 + u * 0.2);
}

export { DEFAULT_EXPLORATION_RATE, stableStringify, sha256Hex };
