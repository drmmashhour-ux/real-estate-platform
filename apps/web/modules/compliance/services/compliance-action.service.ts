import type { ComplianceEvaluationReport } from "@/modules/compliance/core/engine";
import { isProgressionBlocked } from "@/modules/compliance/core/engine";
import { writeComplianceEvaluationAudit } from "@/modules/compliance/core/audit-log";

export class ComplianceProgressionBlockedError extends Error {
  constructor(
    message: string,
    public readonly report: ComplianceEvaluationReport,
  ) {
    super(message);
    this.name = "ComplianceProgressionBlockedError";
  }
}

export function assertComplianceAllowsProgression(report: ComplianceEvaluationReport): void {
  if (isProgressionBlocked(report)) {
    const first = report.decision.blockingFailures[0];
    throw new ComplianceProgressionBlockedError(
      first?.message ?? "Compliance blocked — manual broker/compliance decision required.",
      report,
    );
  }
}

export async function logComplianceOverrideRequest(input: {
  ownerType: string;
  ownerId: string;
  caseId: string;
  actorId: string;
  details: Record<string, unknown>;
}): Promise<void> {
  await writeComplianceEvaluationAudit({
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    caseId: input.caseId,
    actorId: input.actorId,
    actorType: "broker",
    action: "override_requested",
    details: input.details,
  });
}
