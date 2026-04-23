import { prisma } from "@/lib/db";

export const EXECUTIVE_HIGH_RISK_THRESHOLD = 3;

export type ComplianceDashboardSnapshot = {
  complaints: { total: number };
  highRiskCases: number;
  trustIssues: number;
  reviewQueue: Awaited<ReturnType<typeof prisma.complianceManualReviewQueue.findMany>>;
  legalHolds: number;
  alerts: Awaited<ReturnType<typeof prisma.complianceRiskEvent.findMany>>;
  guardrailEscalations30d: number;
  systemStatus: "NORMAL" | "ELEVATED" | "CRITICAL";
};

export async function loadComplianceDashboardSnapshot(input: {
  ownerType: string;
  ownerId: string;
}): Promise<ComplianceDashboardSnapshot> {
  const { ownerType, ownerId } = input;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    complaintTotal,
    highRiskCases,
    trustIssues,
    reviewQueue,
    alerts,
    guardrailEscalations30d,
    legalHolds,
  ] = await Promise.all([
    prisma.complaintCase.count({ where: { ownerType, ownerId } }),
    prisma.complaintCase.count({
      where: {
        ownerType,
        ownerId,
        OR: [
          { severity: { in: ["high", "critical"] } },
          { status: { in: ["open", "investigating", "intake"] } },
        ],
      },
    }),
    ownerType === "solo_broker"
      ? prisma.trustDeposit.count({
          where: { brokerId: ownerId, status: { in: ["disputed", "frozen"] } },
        })
      : ownerType === "agency"
        ? prisma.trustDeposit.count({
            where: { agencyId: ownerId, status: { in: ["disputed", "frozen"] } },
          })
        : Promise.resolve(0),
    prisma.complianceManualReviewQueue.findMany({
      where: { ownerType, ownerId, status: "open" },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.complianceRiskEvent.findMany({
      where: { ownerType, ownerId, reviewed: false },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.complianceGuardrailDecision.count({
      where: {
        ownerType,
        ownerId,
        outcome: { in: ["hard_blocked", "manual_review_required"] },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.privacyDestructionJob.count({
      where: { legalHold: true, status: { notIn: ["COMPLETED", "FAILED"] } },
    }),
  ]);

  let systemStatus: ComplianceDashboardSnapshot["systemStatus"] = "NORMAL";
  if (highRiskCases > EXECUTIVE_HIGH_RISK_THRESHOLD) {
    systemStatus = "CRITICAL";
  } else if (highRiskCases > 0 || trustIssues > 0) {
    systemStatus = "ELEVATED";
  }

  return {
    complaints: { total: complaintTotal },
    highRiskCases,
    trustIssues,
    reviewQueue,
    legalHolds,
    alerts,
    guardrailEscalations30d,
    systemStatus,
  };
}
