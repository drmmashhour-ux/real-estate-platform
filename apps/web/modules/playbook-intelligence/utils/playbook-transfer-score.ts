import type { MemoryDomain } from "@prisma/client";

const BLOCKED_PAIRS = new Set<string>([
  "GROWTH|MESSAGING",
  "GROWTH|RISK",
  "LISTINGS|MESSAGING",
  "DREAM_HOME|MESSAGING",
  "MESSAGING|LEADS",
  "MESSAGING|LISTINGS",
  "RISK|DREAM_HOME",
  "BROKER_ROUTING|MESSAGING",
]);

function key(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function isPairBlocked(s: string, t: string): boolean {
  return BLOCKED_PAIRS.has(key(s, t));
}

const SENSITIVE: Set<string> = new Set(["MESSAGING", "RISK"]);

/**
 * 1.0 = same; 0 = unsafe / blocked; mid = allowed transfer.
 */
export function computeCrossDomainCompatibility(source: MemoryDomain, target: MemoryDomain): number {
  const s = String(source);
  const t = String(target);
  if (s === t) {
    return 1;
  }
  if (SENSITIVE.has(s) || SENSITIVE.has(t)) {
    return 0.04;
  }
  if (isPairBlocked(s, t)) {
    return 0;
  }
  if ((s === "DREAM_HOME" && t === "LISTINGS") || (s === "LISTINGS" && t === "DREAM_HOME")) {
    return 0.9;
  }
  if (s === "GROWTH" && t === "LEADS") {
    return 0.82;
  }
  if (s === "LEADS" && t === "GROWTH") {
    return 0.58;
  }
  if (s === "LEADS" && t === "BROKER_ROUTING") {
    return 0.8;
  }
  if (s === "BROKER_ROUTING" && t === "LEADS") {
    return 0.6;
  }
  return 0.35;
}

export function computeTransferPenalty(source: MemoryDomain, target: MemoryDomain): number {
  const c = computeCrossDomainCompatibility(source, target);
  if (c >= 0.99) {
    return 0;
  }
  if (c === 0) {
    return 0.42;
  }
  return 0.1 + 0.25 * (1 - c);
}

export function computeCrossDomainRecommendationScore(params: {
  baseScore: number;
  sharedFeatureFit: number;
  compatibilityScore: number;
  transferPenalty: number;
  riskPenalty: number;
}): number {
  const { baseScore, sharedFeatureFit, compatibilityScore, transferPenalty, riskPenalty } = params;
  const b = Math.max(0, Math.min(1, baseScore));
  const f = Math.max(0, Math.min(1, sharedFeatureFit));
  const c = Math.max(0, Math.min(1, compatibilityScore));
  const t = Math.max(0, Math.min(0.45, transferPenalty));
  const r = Math.max(0, Math.min(1, riskPenalty));
  const v = f * 0.28 + c * 0.24 + b * 0.32;
  return Math.max(0, Math.min(1, v * (1 - t * 0.55) * (0.65 + 0.35 * (1 - r))));
}
