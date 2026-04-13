import type { FraudEntityType, FraudRiskLevel } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Negative adjustment (0–40) applied to raw trust score from fraud policy + open cases.
 * Confirmed fraud decisions are handled separately in review flows (recompute).
 */
export async function getFraudTrustPenaltyPoints(
  entityType: FraudEntityType,
  entityId: string
): Promise<{ penalty: number; reasons: string[] }> {
  const reasons: string[] = [];
  let penalty = 0;

  const [policy, openCase] = await Promise.all([
    prisma.fraudPolicyScore.findUnique({
      where: { entityType_entityId: { entityType, entityId } },
      select: { riskLevel: true, score: true },
    }),
    prisma.fraudCase.findFirst({
      where: {
        entityType,
        entityId,
        status: { in: ["open", "under_review"] },
      },
      select: { riskLevel: true, status: true },
    }),
  ]);

  const bump = (level: FraudRiskLevel | undefined, pts: number, label: string) => {
    if (!level) return;
    if (level === "critical") {
      penalty += pts + 8;
      reasons.push(`${label}: critical`);
    } else if (level === "high") {
      penalty += pts;
      reasons.push(`${label}: high`);
    } else if (level === "medium") {
      penalty += Math.floor(pts * 0.45);
      reasons.push(`${label}: medium`);
    }
  };

  bump(policy?.riskLevel, 14, "Fraud policy score");
  if (openCase) {
    bump(openCase.riskLevel, 10, "Open fraud case");
  }

  const confirmed = await prisma.fraudCase.findFirst({
    where: {
      entityType,
      entityId,
      status: "confirmed_fraud",
    },
    select: { id: true },
  });
  if (confirmed) {
    penalty += 35;
    reasons.push("Confirmed fraud case on record");
  }

  return { penalty: Math.min(60, penalty), reasons };
}
