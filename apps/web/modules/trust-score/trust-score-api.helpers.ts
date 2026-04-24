import type { LecipmOperationalTrustSnapshot, LecipmTrustEngineTargetType } from "@prisma/client";

export function parseTrustEngineTargetType(raw: string): raw is LecipmTrustEngineTargetType {
  return ["BROKER", "LISTING", "DEAL", "BOOKING", "TERRITORY"].includes(raw);
}

export function snapshotToPayload(row: LecipmOperationalTrustSnapshot) {
  return {
    trustScore: row.trustScore,
    trustBand: row.trustBand,
    contributingFactors: row.contributingFactorsJson,
    warnings: row.warningsJson,
    explain: row.explainJson,
    deltaFromPrior: row.deltaFromPrior,
    weightProfileVersion: row.weightProfileVersion,
    inputsSummary: row.inputsSummaryJson,
    lastComputedAt: row.createdAt.toISOString(),
  };
}
