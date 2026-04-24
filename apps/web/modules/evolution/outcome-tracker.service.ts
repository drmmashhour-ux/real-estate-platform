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
  /** Step 5: Deterministic key for deduplication (fallback to entityId grouping if missing). */
  duplicateKey?: string | null;
};

/**
 * Phase 1 — append-only outcome tracking + optional reinforcement (bounded).
 * Step 6: Async safety — non-blocking, try/catch, log failures only.
 */
export async function recordEvolutionOutcome(args: RecordOutcomeArgs) {
  try {
    // Step 5: Idempotency guard (code-level fallback)
    const duplicateKey = args.duplicateKey;
    if (duplicateKey || (args.idempotent && args.entityId)) {
      const existing = await prisma.evolutionOutcomeEvent.findFirst({
        where: {
          entityId: args.entityId || undefined,
          metricType: args.metricType,
          domain: args.domain,
          strategyKey: args.strategyKey || undefined,
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
  } catch (err) {
    // Step 6: Never block core flow, log failures only
    console.error("[evolution:outcome] failed to record outcome", {
      domain: args.domain,
      metricType: args.metricType,
      strategyKey: args.strategyKey,
      entityId: args.entityId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { id: null, error: true };
  }
}
