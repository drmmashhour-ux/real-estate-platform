import { autonomousGrowthFlags } from "@/config/feature-flags";
import type { AutonomousPolicyBuckets } from "./autonomous-policy-orchestrator.service";
import type { UnifiedAutonomousRow } from "./autonomous-decision-unifier.service";
import { appendAutonomousRunEvents } from "./autonomous-growth.repository";

export type ExecutionResult = {
  executedIds: string[];
  approvalRoutedIds: string[];
  blockedLogged: string[];
  skipped: string[];
  notes: string[];
};

/**
 * Does not perform external ad sync or payments — records audit events and routes approvals only.
 */
export async function executeSafeCandidates(
  runId: string,
  candidates: UnifiedAutonomousRow[],
): Promise<ExecutionResult> {
  const executedIds: string[] = [];
  const skipped: string[] = [];
  const notes: string[] = [];

  if (!autonomousGrowthFlags.autonomousGrowthExecutionV1) {
    notes.push("FEATURE_AUTONOMOUS_GROWTH_EXECUTION_V1 is off — no autonomous execution attempted.");
    for (const row of candidates) {
      skipped.push(row.candidate.recommendationId);
    }
    await appendAutonomousRunEvents(runId, [
      {
        stage: "EXECUTED",
        message: "Execution flag off — safe candidates recorded as skipped (audit only).",
        metadata: { skippedCount: candidates.length },
      },
    ]);
    return { executedIds, approvalRoutedIds: [], blockedLogged: [], skipped, notes };
  }

  const events: Parameters<typeof appendAutonomousRunEvents>[1] = [];

  for (const row of candidates) {
    if (row.candidate.requiresApproval || row.candidate.blockers.length > 0) {
      skipped.push(row.candidate.recommendationId);
      notes.push(`Skipped ${row.candidate.recommendationId} — approval or blockers present.`);
      continue;
    }
    executedIds.push(row.candidate.recommendationId);
    events.push({
      stage: "EXECUTED",
      recommendationId: row.candidate.recommendationId,
      actionType: row.assistant.actionType,
      entityType: row.candidate.entityType ?? undefined,
      entityId: row.candidate.entityId ?? undefined,
      message:
        "Autonomous growth cycle recorded execution intent for low-risk candidate — no external side effects from this layer.",
      metadata: {
        source: row.candidate.source,
        trustScore: row.candidate.trustScore,
        priorityScore: row.candidate.priorityScore,
      },
    });
  }

  if (events.length > 0) {
    await appendAutonomousRunEvents(runId, events);
  }

  return { executedIds, approvalRoutedIds: [], blockedLogged: [], skipped, notes };
}

export async function routeApprovalRequiredCandidates(runId: string, candidates: UnifiedAutonomousRow[]): Promise<string[]> {
  const ids = candidates.map((c) => c.candidate.recommendationId);
  if (ids.length === 0) return [];

  await appendAutonomousRunEvents(
    runId,
    candidates.map((row) => ({
      stage: "APPROVAL_REQUIRED",
      recommendationId: row.candidate.recommendationId,
      actionType: row.assistant.actionType,
      entityType: row.candidate.entityType ?? undefined,
      entityId: row.candidate.entityId ?? undefined,
      message:
        "Routed to human approval queue — not executed by autonomous growth. Use Operator / Platform Core approvals.",
      metadata: { autonomyMode: row.candidate.autonomyMode },
    })),
  );

  return ids;
}

export async function executeAutonomousRun(
  runId: string,
  buckets: AutonomousPolicyBuckets,
): Promise<ExecutionResult> {
  const notes: string[] = [];

  const simFailed = buckets.simulationRequired.filter((r) => r.candidate.requiresSimulation);
  if (simFailed.length > 0) {
    notes.push(
      `${simFailed.length} candidate(s) require simulation review before execution — not auto-executed here.`,
    );
  }

  const safeExec = await executeSafeCandidates(runId, buckets.executableNow);
  const approvalRouted = await routeApprovalRequiredCandidates(runId, buckets.approvalRequired);

  await appendAutonomousRunEvents(runId, [
    {
      stage: "POLICY_BLOCKED",
      message: `Blocked bucket size ${buckets.blocked.length} (audit only).`,
      metadata: { count: buckets.blocked.length },
    },
  ]);

  for (const row of buckets.blocked) {
    await appendAutonomousRunEvents(runId, [
      {
        stage: "POLICY_BLOCKED",
        recommendationId: row.candidate.recommendationId,
        actionType: row.assistant.actionType,
        message: `Blocked: ${row.candidate.blockers.join("; ") || "policy"}`,
      },
    ]);
  }

  return {
    executedIds: safeExec.executedIds,
    approvalRoutedIds: approvalRouted,
    blockedLogged: buckets.blocked.map((b) => b.candidate.recommendationId),
    skipped: safeExec.skipped,
    notes: [...notes, ...safeExec.notes],
  };
}
