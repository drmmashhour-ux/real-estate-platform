import { prisma } from "@/lib/db";

import { MIN_PROFESSIONAL_LIABILITY_COVERAGE_CAD } from "./insurance.types";
import { isBrokerInsuranceValid, getComplianceScoreForBroker } from "./insurance.service";
import { evaluateBrokerInsuranceRisk, evaluateBrokerInsuranceRiskBatch } from "./insurance-risk.engine";

export type TrustScoreResult = {
  trustScore: number; // 0 to 1
  insuranceValid: boolean;
  complianceScore: number; // 0 to 100
  riskScore: number; // 0 to 100
};

/** Canonical Trust Intelligence blend for marketplace ranking and governance (same formula as computeBrokerTrustScore). */
export async function combineTrustSignals(brokerId: string): Promise<TrustScoreResult> {
  return computeBrokerTrustScore(brokerId);
}

export async function computeBrokerTrustScore(brokerId: string): Promise<TrustScoreResult> {
  const [insuranceValid, complianceData, riskData] = await Promise.all([
    isBrokerInsuranceValid(brokerId),
    getComplianceScoreForBroker(brokerId),
    evaluateBrokerInsuranceRisk({ brokerId }),
  ]);

  // Normalize scores to 0-1
  const compliance01 = complianceData.score / 100;
  const risk01 = 1 - (riskData.riskScore / 100); // Inverse of risk
  const insuranceBonus = insuranceValid ? 1 : 0;

  // Blended score
  // 40% insurance, 30% compliance, 30% risk
  const blended = (insuranceBonus * 0.4) + (compliance01 * 0.3) + (risk01 * 0.3);

  return {
    trustScore: Math.max(0, Math.min(1, blended)),
    insuranceValid,
    complianceScore: complianceData.score,
    riskScore: riskData.riskScore,
  };
}

/**
 * Batched 0–1 trust scores for browse (matches `computeBrokerTrustScore` weighting without N× round-trips).
 */
export async function batchBrokerTrustScores01(brokerIds: string[]): Promise<Map<string, number>> {
  const uniq = [...new Set(brokerIds.filter(Boolean))];
  const out = new Map<string, number>();
  if (uniq.length === 0) return out;

  const now = new Date();
  const yearAgo = new Date(now.getTime() - 365 * 86400000);

  const [validPolicies, riskMap, eventAgg] = await Promise.all([
    prisma.brokerInsurance.findMany({
      where: {
        brokerId: { in: uniq },
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
        coveragePerLoss: { gte: MIN_PROFESSIONAL_LIABILITY_COVERAGE_CAD },
      },
      select: { brokerId: true },
    }),
    evaluateBrokerInsuranceRiskBatch(uniq),
    prisma.brokerComplianceEvent
      .groupBy({
        by: ["brokerId"],
        where: {
          brokerId: { in: uniq },
          severity: { in: ["HIGH", "MEDIUM"] },
          createdAt: { gte: yearAgo },
        },
        _count: { _all: true },
      })
      .catch(() => [] as { brokerId: string; _count: { _all: number } }[]),
  ]);

  const validSet = new Set(validPolicies.map((p) => p.brokerId));
  const eventMap = new Map(eventAgg.map((e) => [e.brokerId, e._count._all]));

  for (const id of uniq) {
    const insuranceBonus = validSet.has(id) ? 1 : 0;
    const riskData = riskMap.get(id) ?? { riskScore: 35, severity: "LOW" as const, flags: [] };
    const highEvents = eventMap.get(id) ?? 0;
    const penalty = Math.min(40, riskData.riskScore * 0.35 + highEvents * 5);
    const complianceScore = Math.max(0, Math.round(100 - penalty));
    const compliance01 = complianceScore / 100;
    const risk01 = 1 - riskData.riskScore / 100;
    const blended = insuranceBonus * 0.4 + compliance01 * 0.3 + risk01 * 0.3;
    out.set(id, Math.max(0, Math.min(1, blended)));
  }

  return out;
}
