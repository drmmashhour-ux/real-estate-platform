import {
  BRAIN_V3_DURABILITY_HALF_LIFE_DAYS,
  BRAIN_V3_NEGATIVE_MIN_EVIDENCE,
  BRAIN_V3_POSITIVE_MIN_EVIDENCE,
} from "./brain-v3.constants";
import type { BrainSignalDirection, BrainSignalDurability } from "./brain-v2.types";

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

type Obs = { direction: BrainSignalDirection; createdAt: string; magnitude?: number };

/**
 * Derives durability from a time-ordered series of direction/magnitude observations.
 * Stability rises when direction is consistent; decay applies to older points; confidence uses volume + magnitude spread.
 */
export function computeSignalDurability(observations: Obs[]): BrainSignalDurability {
  if (observations.length === 0) {
    return { stabilityScore: 0.35, decayFactor: 0.85, confidence: 0.2 };
  }

  const now = Date.now();
  const halfLifeMs = BRAIN_V3_DURABILITY_HALF_LIFE_DAYS * 24 * 3600 * 1000;

  let weightedDirSum = 0;
  let weightSum = 0;
  let pos = 0;
  let neg = 0;
  let neu = 0;

  for (const o of observations) {
    const t = new Date(o.createdAt).getTime();
    const ageMs = Math.max(0, now - t);
    const decayFactor = Math.exp(-(ageMs / halfLifeMs) * Math.LN2);
    const mag = clamp01(typeof o.magnitude === "number" ? o.magnitude : 0.5);
    const w = decayFactor * (0.35 + mag * 0.65);
    weightSum += w;
    const dir =
      o.direction === "POSITIVE" ? 1
      : o.direction === "NEGATIVE" ? -1
      : 0;
    weightedDirSum += dir * w;
    if (o.direction === "POSITIVE") pos += 1;
    else if (o.direction === "NEGATIVE") neg += 1;
    else neu += 1;
  }

  const majority = Math.max(pos, neg, neu);
  const consistency = weightSum > 0 ? Math.abs(weightedDirSum) / weightSum : 0;
  const stabilityScore = clamp01(0.25 + consistency * 0.55 + (majority / observations.length) * 0.2);

  const newest = observations.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
  const newestAge = Math.max(0, now - new Date(newest.createdAt).getTime());
  const decayFactor = Number(Math.exp(-(newestAge / halfLifeMs) * Math.LN2).toFixed(4));

  const volBoost = Math.min(1, Math.log1p(observations.length) / Math.log1p(12));
  const evidenceFloor =
    observations.some((o) => o.direction === "NEGATIVE") ? BRAIN_V3_NEGATIVE_MIN_EVIDENCE : BRAIN_V3_POSITIVE_MIN_EVIDENCE;
  const confidence = clamp01(0.15 + volBoost * 0.55 + stabilityScore * 0.25 + (1 - decayFactor) * 0.05 - (1 - evidenceFloor) * 0.1);

  return {
    stabilityScore: Number(stabilityScore.toFixed(4)),
    decayFactor: Number(decayFactor.toFixed(4)),
    confidence: Number(confidence.toFixed(4)),
  };
}
