import type { FraudEntityType, FraudRiskLevel, ReputationEntityType } from "@prisma/client";
import { prisma } from "@/lib/db";

export function toFraudEntity(rep: ReputationEntityType, entityId: string): { entityType: FraudEntityType; entityId: string } {
  if (rep === "listing") return { entityType: "listing", entityId };
  return { entityType: "user", entityId };
}

/** Penalty points subtracted from raw composite (0–35). */
export async function getFraudReputationPenaltyPoints(
  repType: ReputationEntityType,
  entityId: string
): Promise<{ penalty: number; reasons: string[] }> {
  const { entityType, entityId: fid } = toFraudEntity(repType, entityId);
  const reasons: string[] = [];
  let penalty = 0;

  const [policy, openCase, confirmed] = await Promise.all([
    prisma.fraudPolicyScore.findUnique({
      where: { entityType_entityId: { entityType, entityId: fid } },
      select: { riskLevel: true },
    }),
    prisma.fraudCase.findFirst({
      where: { entityType, entityId: fid, status: { in: ["open", "under_review"] } },
      select: { riskLevel: true },
    }),
    prisma.fraudCase.findFirst({
      where: { entityType, entityId: fid, status: "confirmed_fraud" },
      select: { id: true },
    }),
  ]);

  const bump = (level: FraudRiskLevel | undefined, pts: number, label: string) => {
    if (!level) return;
    if (level === "critical") {
      penalty += pts + 6;
      reasons.push(`${label}: critical`);
    } else if (level === "high") {
      penalty += pts;
      reasons.push(`${label}: high`);
    } else if (level === "medium") {
      penalty += Math.floor(pts * 0.4);
      reasons.push(`${label}: medium`);
    }
  };

  bump(policy?.riskLevel, 10, "Fraud policy");
  bump(openCase?.riskLevel, 6, "Open fraud case");
  if (confirmed) {
    penalty += 22;
    reasons.push("Confirmed fraud");
  }

  const fp = await prisma.fraudCase.findFirst({
    where: { entityType, entityId: fid, status: "false_positive" },
    select: { id: true },
  });
  if (fp) {
    penalty = Math.max(0, penalty - 12);
    reasons.push("False positive resolution (softened)");
  }

  return { penalty: Math.min(35, penalty), reasons };
}
