import { complianceInsuranceFlags } from "@/config/feature-flags";

import { batchBrokerTrustScores01 } from "./trust-score.service";

/** Maps broker owner id → sort multiplier for FSBO marketplace browse (deterministic; opt-in flag). */
export async function batchInsuranceTrustSortMultipliers(ownerIds: string[]): Promise<Map<string, number>> {
  const multipliers = new Map<string, number>();
  if (!complianceInsuranceFlags.trustIntelligenceV1 || ownerIds.length === 0) return multipliers;

  const uniq = [...new Set(ownerIds.filter(Boolean))];
  const trust01ByOwner = await batchBrokerTrustScores01(uniq);

  for (const id of uniq) {
    const ts = trust01ByOwner.get(id) ?? 0.35;
    multipliers.set(id, 0.93 + ts * 0.14);
  }

  return multipliers;
}
