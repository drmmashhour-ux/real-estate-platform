import type { FraudEntityType, FraudRiskLevel, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createSystemAlert } from "@/lib/observability";
import { OPEN_CASE_MIN_LEVEL } from "@/lib/fraud/rules";

const levelOrder: FraudRiskLevel[] = ["low", "medium", "high", "critical"];

function shouldOpenCase(level: FraudRiskLevel): boolean {
  const minIdx = levelOrder.indexOf(OPEN_CASE_MIN_LEVEL);
  return levelOrder.indexOf(level) >= minIdx;
}

export async function openFraudCaseIfNeeded(params: {
  entityType: FraudEntityType;
  entityId: string;
  riskLevel: FraudRiskLevel;
  score: number;
  reasonsJson: Prisma.InputJsonValue;
}): Promise<void> {
  if (!shouldOpenCase(params.riskLevel)) return;

  const existing = await prisma.fraudCase.findFirst({
    where: {
      entityType: params.entityType,
      entityId: params.entityId,
      status: { in: ["open", "under_review"] },
    },
    select: { id: true },
  });
  if (existing) return;

  const title = `Fraud review: ${params.entityType} ${params.entityId.slice(0, 12)}…`;
  const summary = `Automated policy score ${params.score}; risk ${params.riskLevel}. Review signals and take action if needed.`;

  await prisma.fraudCase.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      riskLevel: params.riskLevel,
      status: "open",
      title: title.slice(0, 200),
      summary: summary.slice(0, 2000),
      metadataJson: params.reasonsJson,
    },
  });

  if (params.riskLevel === "critical") {
    void createSystemAlert({
      alertType: "FRAUD_CASE_CRITICAL",
      severity: "CRITICAL",
      message: `Critical fraud risk for ${params.entityType} ${params.entityId.slice(0, 24)} (score ${params.score}).`,
      currentValue: params.score,
      metadata: { entityType: params.entityType, entityId: params.entityId },
    }).catch(() => {});
  }
}
