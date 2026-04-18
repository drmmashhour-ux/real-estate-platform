import { autonomousGrowthFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import {
  appendAutonomousRunEvents,
  createAutonomousRun,
  updateAutonomousRunStatus,
} from "./autonomous-growth.repository";
import type { AutonomousRunStatus, AutonomousRunSummary, AutonomousSystemSnapshot } from "./autonomous-growth.types";
import { unifyAutonomousRecommendations } from "./autonomous-decision-unifier.service";
import { buildAutonomousObservationSnapshot } from "./autonomous-observation.service";
import { buildPrioritizedAutonomousCandidates } from "./autonomous-priority.service";
import { evaluateCandidatesAgainstAutonomyPolicies } from "./autonomous-policy-orchestrator.service";
import { simulateAutonomousCandidates } from "./autonomous-simulation.service";
import { executeAutonomousRun } from "./autonomous-execution.service";
import { ingestAutonomousRunIntoLearning } from "./autonomous-learning-feedback.service";
import { scheduleAutonomousReevaluation } from "./autonomous-reevaluation.service";
import type { AutonomousPolicyBuckets } from "./autonomous-policy-orchestrator.service";
import type { AutonomousSimulationSummary } from "./autonomous-simulation.service";
import type { PrioritizedAutonomousResult } from "./autonomous-priority.service";

export type FullCycleResult = {
  summary: AutonomousRunSummary;
  prioritized: PrioritizedAutonomousResult;
  buckets: AutonomousPolicyBuckets;
  simulation: AutonomousSimulationSummary | null;
  notes: string[];
};

/** @internal Exported for tests — composes snapshot counts from policy buckets. */
export function snapshotFromBuckets(
  base: AutonomousSystemSnapshot,
  buckets: AutonomousPolicyBuckets,
): AutonomousSystemSnapshot {
  return {
    ...base,
    executableCount: buckets.executableNow.length,
    blockedCount: buckets.blocked.length,
    approvalRequiredCount: buckets.approvalRequired.length,
    recommendationCount: Math.max(
      base.recommendationCount,
      buckets.executableNow.length +
        buckets.approvalRequired.length +
        buckets.blocked.length +
        buckets.monitorOnly.length,
    ),
  };
}

/**
 * End-to-end autonomous growth cycle — audit-first; execution gated by feature flags.
 */
export async function runFullAutonomousGrowthCycle(opts?: {
  simulateOnly?: boolean;
}): Promise<FullCycleResult> {
  if (!autonomousGrowthFlags.autonomousGrowthSystemV1) {
    throw new Error("FEATURE_AUTONOMOUS_GROWTH_SYSTEM_V1 is off.");
  }

  const notes: string[] = [];
  const run = await createAutonomousRun({
    status: "RUNNING",
    domains: [],
    recommendationCount: 0,
    decisionCount: 0,
    executableCount: 0,
    blockedCount: 0,
    approvalRequiredCount: 0,
    notes: [],
    metadata: { phase: "v7" },
  });

  const runId = run.id;

  try {
    await appendAutonomousRunEvents(runId, [{ stage: "OBSERVED", message: "Autonomous growth cycle started." }]);

    const observation = await buildAutonomousObservationSnapshot();
    await appendAutonomousRunEvents(runId, [
      {
        stage: "OBSERVED",
        message: `Observation complete — ${observation.snapshot.domains.length} domain(s), ${observation.snapshot.recommendationCount} recommendation(s).`,
        metadata: { domains: observation.snapshot.domains },
      },
    ]);

    const unified = unifyAutonomousRecommendations({ observation });
    await appendAutonomousRunEvents(runId, [
      {
        stage: "DECIDED",
        message: `Unified ${unified.length} candidate(s) from assistant + subsystem outputs.`,
      },
    ]);

    const prioritized = await buildPrioritizedAutonomousCandidates(unified);
    for (const n of prioritized.conflictNotes) {
      notes.push(n);
    }
    for (const d of prioritized.dropped) {
      notes.push(`Dropped ${d.recommendationId}: ${d.note}`);
    }

    await appendAutonomousRunEvents(runId, [
      {
        stage: "PRIORITIZED",
        message: `Priority + conflict pass — ${prioritized.ordered.length} candidate(s) after resolution.`,
        metadata: { dropped: prioritized.dropped.length },
      },
    ]);

    const { buckets, mode } = await evaluateCandidatesAgainstAutonomyPolicies(prioritized.ordered);
    await appendAutonomousRunEvents(runId, [
      {
        stage: "POLICY_BLOCKED",
        message: `Policy evaluation under mode ${mode} — executable ${buckets.executableNow.length}, approval ${buckets.approvalRequired.length}, blocked ${buckets.blocked.length}, monitor ${buckets.monitorOnly.length}.`,
      },
    ]);

    let simulation: AutonomousSimulationSummary | null = null;
    if (autonomousGrowthFlags.autonomousGrowthSimulationV1) {
      const simRows = [
        ...buckets.executableNow,
        ...buckets.approvalRequired,
        ...buckets.simulationRequired,
      ];
      const unique = new Map(simRows.map((r) => [r.candidate.recommendationId, r]));
      simulation = await simulateAutonomousCandidates([...unique.values()]);
      await appendAutonomousRunEvents(runId, [
        {
          stage: "SIMULATED",
          message:
            "Simulation summary recorded (heuristic estimates). Review notes and risk list before any execution.",
          metadata: {
            operatorCtr: simulation.operator?.ctrDeltaApprox,
            operatorProfit: simulation.operator?.profitDeltaApprox,
          },
        },
      ]);
    } else {
      notes.push("Simulation pass skipped — enable FEATURE_AUTONOMOUS_GROWTH_SIMULATION_V1.");
    }

    let executionNotes: string[] = [];
    if (!opts?.simulateOnly) {
      const exec = await executeAutonomousRun(runId, buckets);
      executionNotes = exec.notes;
      notes.push(...executionNotes);
      await appendAutonomousRunEvents(runId, [
        {
          stage: "EXECUTED",
          message: `Execution phase — executed intents ${exec.executedIds.length}, approval routed ${exec.approvalRoutedIds.length}.`,
        },
      ]);

      const learn = await ingestAutonomousRunIntoLearning(runId);
      notes.push(...learn.notes);

      if (autonomousGrowthFlags.autonomousGrowthReevaluationV1) {
        await scheduleAutonomousReevaluation(runId, 24);
      } else {
        notes.push("Reevaluation not scheduled — enable FEATURE_AUTONOMOUS_GROWTH_REEVALUATION_V1.");
      }
    } else {
      notes.push("simulateOnly=true — skipped execution, learning, and reevaluation scheduling.");
    }

    const partial =
      observation.snapshot.warnings.length > 0 ||
      prioritized.dropped.length > 0 ||
      (observation.raw.assistantFeed?.subsystemWarnings.length ?? 0) > 0;
    const status: AutonomousRunStatus = partial ? "PARTIAL" : "SUCCEEDED";

    const snap = snapshotFromBuckets(observation.snapshot, buckets);
    snap.approvalRequiredCount = buckets.approvalRequired.length;
    snap.executableCount = buckets.executableNow.length;
    snap.blockedCount = buckets.blocked.length;

    await prisma.autonomousGrowthRun.update({
      where: { id: runId },
      data: {
        status,
        domains: snap.domains as object,
        recommendationCount: snap.recommendationCount,
        decisionCount: prioritized.ordered.length,
        executableCount: snap.executableCount,
        blockedCount: snap.blockedCount,
        approvalRequiredCount: snap.approvalRequiredCount,
        notes: notes as object,
        metadata: { phase: "v7", mode, simulateOnly: !!opts?.simulateOnly } as object,
      },
    });

    const summary: AutonomousRunSummary = {
      runId,
      status,
      snapshot: snap,
      notes,
      createdAt: run.createdAt.toISOString(),
    };

    return { summary, prioritized, buckets, simulation, notes };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    notes.push(`FAILED: ${msg}`);
    await appendAutonomousRunEvents(runId, [{ stage: "FAILED", message: msg }]);
    await updateAutonomousRunStatus(runId, "FAILED", { error: msg });
    throw e;
  }
}