import { prisma } from "@/lib/db";
import type { EvolutionDomain, EvolutionMetricType } from "./evolution.types";
import { compareExpectedVsActual } from "./feedback.engine";
import { applyReinforcementToMemory } from "./strategy-memory.service";
import { logEvolution } from "./evolution-logger";

export type RecordOutcomeArgs = {
  domain: EvolutionDomain;
  metricType: EvolutionMetricType;
  strategyKey?: string | null;
  experimentKey?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  expectedJson?: Record<string, unknown> | null;
  actualJson?: Record<string, unknown> | null;
  /** Optional scalar expectation / actual for feedback engine. */
  expected?: number | null;
  actual?: number | null;
  /** When true, update reinforcement memory for strategyKey (if provided). */
  reinforceStrategy?: boolean;
  /** When true, skip if an outcome for same entityId + metricType + domain already exists. */
  idempotent?: boolean;
};

/**
 * Phase 1 — append-only outcome tracking + optional reinforcement (bounded).
 */
export async function recordEvolutionOutcome(args: RecordOutcomeArgs) {
  if (args.idempotent && args.entityId) {
    const existing = await prisma.evolutionOutcomeEvent.findFirst({
      where: {
        entityId: args.entityId,
        metricType: args.metricType,
        domain: args.domain,
      },
      select: { id: true },
    });
    if (existing) {
      return { id: existing.id, skipped: true };
    }
  }

  const fb = compareExpectedVsActual({
    expected: args.expected ?? undefined,
    actual: args.actual ?? undefined,
  });

  const row = await prisma.evolutionOutcomeEvent.create({
    data: {
      domain: args.domain,
      metricType: args.metricType,
      strategyKey: args.strategyKey ?? null,
      experimentKey: args.experimentKey ?? null,
      entityType: args.entityType ?? null,
      entityId: args.entityId ?? null,
      expectedJson: args.expectedJson ?? undefined,
      actualJson: args.actualJson ?? undefined,
      varianceScore: fb.varianceScore,
      notes: fb.explanation.slice(0, 2000),
    },
  });

  logEvolution("outcome", {
    id: row.id,
    domain: args.domain,
    metricType: args.metricType,
    strategyKey: args.strategyKey,
    experimentKey: args.experimentKey,
    assessment: fb.assessment,
  });

  if (args.reinforceStrategy && args.strategyKey && fb.assessment !== "INSUFFICIENT_DATA") {
    await applyReinforcementToMemory({
      domain: args.domain,
      strategyKey: args.strategyKey,
      assessment: fb.assessment,
    });
  }

  return { id: row.id, feedback: fb };
}
