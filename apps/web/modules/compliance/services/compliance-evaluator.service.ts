import { runComplianceEngine, type ComplianceEvaluationReport } from "@/modules/compliance/core/engine";
import type { ComplianceCaseContext } from "@/modules/compliance/core/rule-types";
import { writeComplianceEvaluationAudit } from "@/modules/compliance/core/audit-log";

export type EvaluateComplianceInput = {
  ctx: ComplianceCaseContext;
  ownerType: string;
  ownerId: string;
  actorId: string;
  actorType: "system" | "broker" | "admin";
  persistAudit?: boolean;
};

export async function evaluateComplianceCase(input: EvaluateComplianceInput): Promise<ComplianceEvaluationReport> {
  const report = runComplianceEngine(input.ctx);

  if (input.persistAudit !== false) {
    await writeComplianceEvaluationAudit({
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      caseId: input.ctx.caseId,
      actorId: input.actorId,
      actorType: input.actorType,
      action: report.decision.status === "blocked" ? "blocked" : "evaluated",
      details: {
        status: report.decision.status,
        worstSeverity: report.decision.worstSeverity,
        failedRuleIds: report.results.filter((x) => !x.passed).map((x) => x.ruleId),
        blockingFailures: report.decision.blockingFailures.map((x) => x.ruleId),
        evaluatedAt: report.evaluatedAt,
      },
    });
  }

  return report;
}
