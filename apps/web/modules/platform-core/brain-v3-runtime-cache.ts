import { BRAIN_V3_CROSS_DOMAIN_RANKING_CAP, BRAIN_V3_CTA_BIAS_CAP, BRAIN_V3_PROFIT_PRIORITY_CAP } from "./brain-v3.constants";
import type { BrainCrossDomainImpact, CrossDomainLearningSignal } from "./brain-v2.types";

let lastSignals: CrossDomainLearningSignal[] = [];
let lastImpacts: BrainCrossDomainImpact[] = [];
let lastGuardNotes: string[] = [];
let lastUpdatedAt: string | null = null;

export function setBrainV3RuntimeSnapshot(input: {
  signals: CrossDomainLearningSignal[];
  impacts: BrainCrossDomainImpact[];
  guardNotes: string[];
}): void {
  lastSignals = input.signals;
  lastImpacts = input.impacts;
  lastGuardNotes = input.guardNotes;
  lastUpdatedAt = new Date().toISOString();
}

export function getBrainV3RuntimeSnapshot(): {
  signals: CrossDomainLearningSignal[];
  impacts: BrainCrossDomainImpact[];
  guardNotes: string[];
  lastUpdatedAt: string | null;
} {
  return {
    signals: lastSignals,
    impacts: lastImpacts,
    guardNotes: lastGuardNotes,
    lastUpdatedAt,
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Listing-level boost from MARKETPLACE/CRO/ADS signals tied to this listing id (capped). */
export function listingCrossDomainBoost01(listingId: string): number {
  let s = 0;
  for (const sig of lastSignals) {
    if (!sig.entityId || sig.entityId !== listingId) continue;
    if (sig.direction !== "POSITIVE") continue;
    const dom = sig.source;
    if (dom === "MARKETPLACE" || dom === "CRO" || dom === "ADS") {
      s += sig.magnitude * sig.durability.confidence * (dom === "MARKETPLACE" ? 1 : 0.85);
    }
  }
  for (const im of lastImpacts) {
    if (im.affectedDomain !== "MARKETPLACE" && im.affectedDomain !== "CRO") continue;
    s += Math.abs(im.impactWeight) * 0.15;
  }
  return clamp(s, -BRAIN_V3_CROSS_DOMAIN_RANKING_CAP, BRAIN_V3_CROSS_DOMAIN_RANKING_CAP);
}

/**
 * Safe bounded adjustment on 0–1 blended rank — never replaces base score.
 */
export function applyCrossDomainRankingAdjustment(input: { listingId: string; blended01: number }): number {
  const b = listingCrossDomainBoost01(input.listingId);
  return clamp(Number((input.blended01 + b).toFixed(4)), 0, 1);
}

/** Primary CTA label bias −cap..+cap from CRO/RETARGETING/ADS cross signals. */
export function ctaPrimaryBiasForLabel(label: string): number {
  let b = 0;
  for (const sig of lastSignals) {
    if (sig.source !== "CRO" && sig.source !== "RETARGETING" && sig.source !== "ADS") continue;
    if (sig.direction !== "POSITIVE") continue;
    const hint = String(sig.metadata?.ctaHint ?? sig.reason).toLowerCase();
    if (hint && label.toLowerCase().split(/\s+/).some((w) => w.length > 2 && hint.includes(w))) {
      b += sig.magnitude * 0.02;
    }
  }
  return clamp(b, -BRAIN_V3_CTA_BIAS_CAP, BRAIN_V3_CTA_BIAS_CAP);
}

export function campaignPriorityBias(campaignId: string): number {
  let b = 0;
  for (const sig of lastSignals) {
    if (!sig.entityId || sig.entityId !== campaignId) continue;
    if (sig.source !== "PROFIT" && sig.source !== "ADS") continue;
    if (sig.direction === "POSITIVE") b += sig.magnitude * sig.durability.confidence * 0.04;
    if (sig.direction === "NEGATIVE") b -= sig.magnitude * sig.durability.confidence * 0.03;
  }
  for (const im of lastImpacts) {
    if (im.affectedDomain !== "ADS") continue;
    if (im.source === "PROFIT") b += im.impactWeight * 0.08;
  }
  return clamp(b, -BRAIN_V3_PROFIT_PRIORITY_CAP, BRAIN_V3_PROFIT_PRIORITY_CAP);
}

export function retargetingStrength01(): number {
  let p = 0;
  for (const sig of lastSignals) {
    if (sig.source !== "ADS" && sig.source !== "CRO" && sig.source !== "RETARGETING") continue;
    if (sig.direction !== "POSITIVE") continue;
    p += sig.magnitude * sig.durability.confidence;
  }
  return clamp(p / 3, 0, 1);
}

export function clearBrainV3RuntimeSnapshotForTests(): void {
  lastSignals = [];
  lastImpacts = [];
  lastGuardNotes = [];
  lastUpdatedAt = null;
}
