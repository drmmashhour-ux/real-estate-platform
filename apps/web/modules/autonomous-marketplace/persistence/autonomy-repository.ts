import { prisma } from "@/lib/db";
import type {
  AutonomousRun,
  Opportunity,
  PolicyDecision,
  ProposedAction,
} from "../types/domain.types";
import type { ExecutionResult } from "../types/domain.types";
import type { GovernanceResolution } from "../types/domain.types";
import type { ObservationSnapshot } from "../types/domain.types";
import type { AutonomousRunSummary } from "../types/domain.types";

export async function persistAutonomousRun(input: {
  summary: AutonomousRunSummary;
  observation: ObservationSnapshot;
  opportunities: Opportunity[];
  /** Full payload stored for idempotent replay */
  fullPayload: AutonomousRun;
  traces: Array<{
    proposed: ProposedAction;
    policy: PolicyDecision;
    governance: GovernanceResolution;
    execution: ExecutionResult;
  }>;
  idempotencyKey?: string | null;
  createdByUserId?: string | null;
}) {
  const run = await prisma.autonomousMarketplaceRun.create({
    data: {
      targetType: input.summary.target.type,
      targetId: input.summary.target.id,
      autonomyMode: input.summary.autonomyMode,
      dryRun: input.summary.dryRun,
      status: input.summary.status,
      signalsSummaryJson: input.summary.signalsSummary as object,
      observationJson: input.observation as unknown as object,
      opportunitiesJson: input.opportunities as unknown as object,
      summaryJson: input.fullPayload as unknown as object,
      idempotencyKey: input.idempotencyKey ?? undefined,
      createdByUserId: input.createdByUserId ?? undefined,
      actions: {
        create: input.traces.map((t) => ({
          detectorId: t.proposed.sourceDetectorId,
          actionType: t.proposed.type,
          proposedActionJson: t.proposed as unknown as object,
          policyDecisionJson: t.policy as unknown as object,
          governanceDisposition: t.governance.disposition,
          executionStatus: t.execution.status,
          executionResultJson: t.execution as unknown as object,
          outcomeJson: {
            governanceReason: t.governance.reason,
          } as object,
          idempotencyKey: `${input.summary.runId}:${t.proposed.id}`,
          errorMessage: t.execution.errorCode ?? undefined,
        })),
      },
    },
    select: { id: true },
  });

  await Promise.all(
    input.traces.flatMap((t) =>
      t.policy.ruleResults.map((r) =>
        prisma.autonomousMarketplacePolicyRecord.create({
          data: {
            runId: run.id,
            ruleCode: r.ruleCode,
            result: r.result,
            dispositionHint: r.dispositionHint ?? undefined,
            reason: r.reason,
            metadataJson: (r.metadata ?? {}) as object,
          },
        }),
      ),
    ),
  );

  await prisma.autonomousMarketplaceOutcomeRecord.create({
    data: {
      runId: run.id,
      targetType: input.summary.target.type,
      targetId: input.summary.target.id,
      snapshotJson: {
        metrics: input.summary.metrics,
        warnings: input.summary.warnings,
      } as object,
      notes: input.summary.errors.join("; ") || undefined,
    },
  });

  return run.id;
}
