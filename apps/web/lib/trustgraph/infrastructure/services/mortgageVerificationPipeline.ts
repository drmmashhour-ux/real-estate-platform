import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { persistVerificationCaseRun } from "@/lib/trustgraph/application/persistVerificationCaseRun";
import { collectMortgageReadinessRuleResults } from "@/lib/trustgraph/infrastructure/rules/mortgageRulesRegistry";

export async function runMortgageReadinessPipeline(args: {
  caseId: string;
  mortgageRequestId: string;
  actorUserId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.mortgageRequest.findUnique({ where: { id: args.mortgageRequestId } });
  if (!row) return { ok: false, error: "Mortgage request not found" };

  const results = collectMortgageReadinessRuleResults({
    propertyPrice: row.propertyPrice,
    downPayment: row.downPayment,
    income: row.income,
    timeline: row.timeline,
    employmentStatus: row.employmentStatus,
    creditRange: row.creditRange,
  });

  const outcome = await prisma.$transaction(async (tx) => {
    return persistVerificationCaseRun(tx, {
      caseId: args.caseId,
      results,
      trustProfile: { kind: "none" },
    });
  });

  void recordPlatformEvent({
    eventType: "trustgraph_mortgage_readiness_run",
    sourceModule: "trustgraph",
    entityType: "VERIFICATION_CASE",
    entityId: args.caseId,
    payload: {
      mortgageRequestId: args.mortgageRequestId,
      overallScore: outcome.overallScore,
      trustLevel: outcome.trustLevel,
      readinessLevel: outcome.readinessLevel,
    },
  }).catch(() => {});

  return { ok: true };
}
