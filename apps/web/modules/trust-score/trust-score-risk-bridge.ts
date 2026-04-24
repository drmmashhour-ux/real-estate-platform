import type { LecipmTrustOperationalBand } from "@prisma/client";

/**
 * Lightweight adapter so dispute prediction, AI CEO risk, and prevention flows can ingest
 * operational trust as **one feature** inside broader risk context (never the sole gate).
 */
export type OperationalTrustRiskFeature = {
  featureId: "lecipm_operational_trust_v1";
  trustScore: number;
  trustBand: LecipmTrustOperationalBand;
  weight: number;
  note: string;
};

export function operationalTrustAsRiskFeature(input: {
  trustScore: number;
  trustBand: LecipmTrustOperationalBand;
  /** Keep ≤0.25 so trust never dominates composite risk in v1. */
  weight?: number;
}): OperationalTrustRiskFeature {
  return {
    featureId: "lecipm_operational_trust_v1",
    trustScore: input.trustScore,
    trustBand: input.trustBand,
    weight: input.weight ?? 0.18,
    note: "Operational trust complements dispute prediction — policy review before automated sanctions.",
  };
}
