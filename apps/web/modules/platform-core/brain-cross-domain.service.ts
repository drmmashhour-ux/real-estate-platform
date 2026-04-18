import type { CoreSystemSource } from "./platform-core.types";
import type { BrainCrossDomainImpact, CrossDomainLearningSignal } from "./brain-v2.types";

function clampMag(m: number): number {
  return Math.min(1, Math.max(0, m));
}

/**
 * Deterministic cross-domain influence graph — explainable weights only; does not execute campaigns.
 */
export function propagateSignalAcrossDomains(signal: CrossDomainLearningSignal): BrainCrossDomainImpact[] {
  const w = clampMag(signal.magnitude) * signal.durability.confidence * (0.4 + signal.durability.stabilityScore * 0.6);
  if (signal.direction === "NEUTRAL" || w < 0.02) return [];

  const sign = signal.direction === "POSITIVE" ? 1 : -1;
  const base = sign * w;
  const src = signal.source;
  const out: BrainCrossDomainImpact[] = [];

  const push = (affected: CoreSystemSource, weight: number, reason: string) => {
    out.push({
      source: src,
      affectedDomain: affected,
      impactWeight: Number((base * weight).toFixed(4)),
      reason,
    });
  };

  switch (src) {
    case "ADS":
      push("RETARGETING", 0.35, "ADS performance informs retargeting message strength");
      push("PROFIT", 0.4, "ADS signals feed campaign economics confidence");
      push("CRO", 0.25, "ADS creative hints may inform CTA prioritization");
      break;
    case "CRO":
      push("RETARGETING", 0.45, "CRO surfaces inform retargeting copy/urgency");
      push("ADS", 0.35, "CRO winners suggest creative/landing alignment");
      break;
    case "RETARGETING":
      push("CRO", 0.4, "Retargeting engagement informs on-site urgency/messaging");
      push("ADS", 0.35, "Audience quality feedback to acquisition");
      break;
    case "PROFIT":
      push("ADS", 0.55, "Profitability gates scaling priority");
      push("MARKETPLACE", 0.25, "Economics inform marketplace visibility tradeoffs");
      break;
    case "MARKETPLACE":
      push("CRO", 0.4, "Marketplace trust/quality informs on-site trust CTAs");
      push("ADS", 0.35, "Listing quality hints for creative/audience filters");
      break;
    case "AB_TEST":
      push("CRO", 0.45, "Experiment outcomes inform CTA/variant choices");
      push("ADS", 0.35, "Experiment winners inform paid creative");
      break;
    case "UNIFIED":
      push("ADS", 0.3, "Unified snapshot nudges acquisition balance");
      push("RETARGETING", 0.3, "Unified snapshot nudges nurture");
      push("CRO", 0.25, "Unified snapshot nudges on-site");
      break;
    case "OPERATOR":
      push("UNIFIED", 0.35, "Operator layer signals feed unified orchestration");
      push("ADS", 0.25, "Operator decisions may inform paid acquisition");
      break;
    default:
      break;
  }

  return out.filter((x) => Math.abs(x.impactWeight) >= 0.001);
}
