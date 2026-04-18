/**
 * LECIPM PLATFORM — One Brain V2 conservative batch learning (manual runs; audited).
 */
import { PLATFORM_CORE_AUDIT } from "./platform-core.constants";
import { isPlatformCoreAuditEffective } from "@/config/feature-flags";
import { createAuditEvent } from "./platform-core.repository";
import { adaptSourceWeight } from "./brain-weight-adaptation.service";
import type { BrainLearningSource, BrainOutcomeRecord, BrainSourceWeight } from "./brain-v2.types";
import {
  createLearningRun,
  getCurrentSourceWeights,
  getLatestLearningSnapshot,
  listDecisionOutcomes,
  upsertSourceWeights,
  type BrainLearningRunDTO,
} from "./brain-v2.repository";
import { prisma } from "@/lib/db";

export type BrainAdaptiveLearningResult = {
  updatedWeights: BrainSourceWeight[];
  changedSources: BrainLearningSource[];
  notes: string[];
  warnings: string[];
  learningRun: BrainLearningRunDTO | null;
};

function recordToBrainOutcome(r: {
  decisionId: string;
  source: string;
  entityType: string;
  entityId: string | null;
  actionType: string;
  outcomeType: string;
  outcomeScore: number;
  observedMetrics: Record<string, unknown> | null;
  reason: string;
  createdAt: Date;
}): BrainOutcomeRecord {
  return {
    decisionId: r.decisionId,
    source: r.source as BrainLearningSource,
    entityType: r.entityType,
    entityId: r.entityId,
    actionType: r.actionType,
    outcomeType: r.outcomeType as BrainOutcomeRecord["outcomeType"],
    outcomeScore: r.outcomeScore,
    observedMetrics: r.observedMetrics ?? undefined,
    reason: r.reason,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function runBrainAdaptiveLearning(input?: {
  /** Only outcomes newer than the last learning run (default). Set to override window. */
  since?: Date;
}): Promise<BrainAdaptiveLearningResult> {
  const lastRun = await prisma.brainLearningRun.findFirst({ orderBy: { createdAt: "desc" } });
  const defaultSince = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const since = input?.since ?? defaultSince;

  const recent = await listDecisionOutcomes(
    lastRun && !input?.since ?
      { after: lastRun.createdAt, limit: 2000 }
    : { since, limit: 2000 },
  );
  const asRecords = recent.map((x) =>
    recordToBrainOutcome({
      decisionId: x.decisionId,
      source: x.source,
      entityType: x.entityType,
      entityId: x.entityId,
      actionType: x.actionType,
      outcomeType: x.outcomeType,
      outcomeScore: x.outcomeScore,
      observedMetrics: x.observedMetrics,
      reason: x.reason,
      createdAt: x.createdAt,
    }),
  );

  const usable = asRecords.filter((o) => o.outcomeType !== "INSUFFICIENT_DATA");
  const notes: string[] = [];
  const warnings: string[] = [];

  if (usable.length === 0) {
    notes.push("No eligible outcomes since last run (excluding insufficient-data rows). Weights unchanged.");
    return {
      updatedWeights: await getCurrentSourceWeights(),
      changedSources: [],
      notes,
      warnings,
      learningRun: null,
    };
  }

  const current = await getCurrentSourceWeights();
  const changedSources: BrainLearningSource[] = [];
  const next: BrainSourceWeight[] = [];

  for (const w of current) {
    const forSource = usable.filter((o) => o.source === w.source);
    const adapted = adaptSourceWeight({ current: w, outcomes: forSource });
    if (
      adapted.weight !== w.weight ||
      adapted.confidence !== w.confidence ||
      adapted.sampleCount !== w.sampleCount
    ) {
      changedSources.push(w.source);
    }
    next.push(adapted);
  }

  await upsertSourceWeights(next);

  const runNotes = [`Processed ${usable.length} outcome(s) since ${since.toISOString()}`];
  const run = await createLearningRun({
    sourceCount: changedSources.length,
    decisionCount: usable.length,
    notes: runNotes,
    metadata: { since: since.toISOString(), changedSources },
  });

  if (isPlatformCoreAuditEffective()) {
    await createAuditEvent({
      eventType: PLATFORM_CORE_AUDIT.BRAIN_V2_WEIGHTS_ADAPTED,
      source: "UNIFIED",
      entityType: "UNKNOWN",
      entityId: null,
      message: `One Brain V2 adapted ${changedSources.length} source weight(s) from ${usable.length} outcome(s).`,
      metadata: { learningRunId: run.id, changedSources },
    });
  }

  try {
    const { buildCrossDomainSignalsFromOutcomes } = await import("./brain-signal-aggregator.service");
    const v3 = await buildCrossDomainSignalsFromOutcomes(asRecords);
    notes.push(...v3.notes);
  } catch (e) {
    warnings.push(`Brain V3 cross-domain aggregation: ${e instanceof Error ? e.message : "skipped"}`);
  }

  notes.push(`Learning run ${run.id} persisted.`);
  return {
    updatedWeights: next,
    changedSources,
    notes,
    warnings,
    learningRun: run,
  };
}

export async function getBrainAdaptiveSnapshot(): Promise<BrainAdaptiveLearningResult> {
  const last = await getLatestLearningSnapshot();
  return {
    updatedWeights: await getCurrentSourceWeights(),
    changedSources: [],
    notes:
      last ?
        [`Last run ${last.createdAt.toISOString()} — ${last.decisionCount} outcomes considered.`]
      : ["No learning runs yet."],
    warnings: [],
    learningRun: last,
  };
}
