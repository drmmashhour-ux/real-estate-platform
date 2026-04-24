import { prisma } from "@/lib/db";
import { CeoDataAggregatorService } from "./ceo-data-aggregator.service";
import { gatherMarketSignals } from "./ceo-market-signals.service";
import {
  extractFlatMetricsFromCeoContext,
  extractFlatMetricsFromSignals,
} from "./ceo-memory.service";
import { logCeoMemoryTagged } from "@/lib/server/launch-logger";

const DEFAULT_MIN_AGE_HOURS = Number(process.env.CEO_OUTCOME_MIN_AGE_HOURS ?? 24);
const BATCH_LIMIT = Number(process.env.CEO_OUTCOME_TRACK_BATCH ?? 40);

type OutcomeLabel = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

function computeImpactAndLabel(
  before: Record<string, number>,
  after: Record<string, number>,
): { impactScore: number; resultLabel: OutcomeLabel; insufficientData: boolean } {
  const keys = Object.keys(before).filter(
    (k) => k in after && Number.isFinite(before[k]) && Number.isFinite(after[k]),
  );
  if (keys.length === 0) {
    return { impactScore: 0, resultLabel: "NEUTRAL", insufficientData: true };
  }

  let sum = 0;
  for (const k of keys) {
    const b = before[k];
    const a = after[k]!;
    const denom = Math.max(1e-9, Math.abs(b));
    sum += (a - b) / denom;
  }
  const impactScore = Math.max(-1, Math.min(1, sum / keys.length));

  let resultLabel: OutcomeLabel = "NEUTRAL";
  if (impactScore > 0.2) resultLabel = "POSITIVE";
  else if (impactScore < -0.2) resultLabel = "NEGATIVE";

  return { impactScore, resultLabel, insufficientData: false };
}

function readMetricsSnapshot(payload: unknown): Record<string, number> | null {
  if (!payload || typeof payload !== "object") return null;
  const raw = (payload as { metricsSnapshot?: unknown }).metricsSnapshot;
  if (!raw || typeof raw !== "object") return null;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : null;
}

async function buildAfterMetricsFlat(): Promise<Record<string, number>> {
  const [ctx, signals] = await Promise.all([
    CeoDataAggregatorService.buildCeoContext().catch(() => null),
    gatherMarketSignals().catch(() => null),
  ]);

  return {
    ...(ctx ? extractFlatMetricsFromCeoContext(ctx) : {}),
    ...(signals ? extractFlatMetricsFromSignals(signals) : {}),
  };
}

async function persistOutcomeForMemory(
  memory: { id: string; createdAt: Date; payloadJson: unknown },
  afterFlat: Record<string, number>,
): Promise<"processed" | "skipped" | "error"> {
  try {
    const dup = await prisma.ceoDecisionOutcome.findUnique({ where: { memoryId: memory.id } });
    if (dup) return "skipped";

    const capturedAt = new Date().toISOString();
    const before = readMetricsSnapshot(memory.payloadJson);

    if (!before) {
      await prisma.ceoDecisionOutcome.create({
        data: {
          memoryId: memory.id,
          outcomeWindowDays: Math.max(
            1,
            Math.round((Date.now() - memory.createdAt.getTime()) / 86_400_000),
          ),
          metricsBeforeJson: {},
          metricsAfterJson: { ...afterFlat, capturedAt, note: "no_metrics_snapshot_at_decision" },
          impactScore: 0,
          resultLabel: "NEUTRAL",
        },
      });
      logCeoMemoryTagged.info("outcome_recorded", {
        memoryId: memory.id,
        resultLabel: "NEUTRAL",
        reason: "missing_before_metrics",
      });
      return "processed";
    }

    const { impactScore, resultLabel, insufficientData } = computeImpactAndLabel(before, afterFlat);
    const finalLabel: OutcomeLabel = insufficientData ? "NEUTRAL" : resultLabel;
    const finalImpact = insufficientData ? 0 : impactScore;

    await prisma.ceoDecisionOutcome.create({
      data: {
        memoryId: memory.id,
        outcomeWindowDays: Math.max(
          1,
          Math.round((Date.now() - memory.createdAt.getTime()) / 86_400_000),
        ),
        metricsBeforeJson: before as object,
        metricsAfterJson: { ...afterFlat, capturedAt, insufficientOverlap: insufficientData },
        impactScore: finalImpact,
        resultLabel: finalLabel,
      },
    });

    logCeoMemoryTagged.info("outcome_recorded", {
      memoryId: memory.id,
      resultLabel: finalLabel,
      impactScore: finalImpact,
      insufficientData,
    });
    return "processed";
  } catch (e) {
    const code = e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "P2002") return "skipped";
    logCeoMemoryTagged.error("outcome_track_failed", {
      memoryId: memory.id,
      message: e instanceof Error ? e.message : String(e),
    });
    return "error";
  }
}

/**
 * Periodically evaluates CEO decision memories that are old enough and lack an outcome.
 * Uses real before/after metric snapshots only — never fabricates positive/negative labels without comparable data.
 */
export async function trackCeoOutcomes(): Promise<{
  processed: number;
  skipped: number;
  errors: number;
}> {
  const minAgeMs = Math.max(1, DEFAULT_MIN_AGE_HOURS) * 3600_000;
  const cutoff = new Date(Date.now() - minAgeMs);

  const memories = await prisma.ceoDecisionMemory.findMany({
    where: {
      createdAt: { lte: cutoff },
      outcomes: { none: {} },
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_LIMIT,
  });

  if (memories.length === 0) {
    return { processed: 0, skipped: 0, errors: 0 };
  }

  const afterFlat = await buildAfterMetricsFlat();
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const memory of memories) {
    const r = await persistOutcomeForMemory(memory, afterFlat);
    if (r === "processed") processed += 1;
    else if (r === "skipped") skipped += 1;
    else errors += 1;
  }

  return { processed, skipped, errors };
}

/**
 * Evaluate a single memory row if it has no outcome yet (idempotent).
 */
export async function trackCeoOutcomeForMemory(memoryId: string): Promise<{
  ok: boolean;
  status: "processed" | "skipped" | "error" | "not_found";
}> {
  const memory = await prisma.ceoDecisionMemory.findUnique({
    where: { id: memoryId },
    include: { outcomes: true },
  });

  if (!memory) return { ok: false, status: "not_found" };
  if (memory.outcomes.length > 0) return { ok: true, status: "skipped" };

  const afterFlat = await buildAfterMetricsFlat();
  const r = await persistOutcomeForMemory(memory, afterFlat);
  if (r === "processed") return { ok: true, status: "processed" };
  if (r === "skipped") return { ok: true, status: "skipped" };
  return { ok: false, status: "error" };
}
