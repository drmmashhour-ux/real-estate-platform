/**
 * V8 Brain shadow observer — reads public snapshot/outcome data only; optional audit persistence.
 * Never writes to brain outcome tables or learning runs.
 */
import {
  isPlatformCoreAuditEffective,
  oneBrainV8Flags,
  platformCoreFlags,
} from "@/config/feature-flags";
import { logInfo, logWarn } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { buildBrainSnapshot } from "./brain-snapshot.service";
import { PLATFORM_CORE_AUDIT } from "./platform-core.constants";
import { createAuditEvent } from "./platform-core.repository";
import { aggregateShadowDeltas, buildShadowRowsFromOutcomes } from "./brain-v8-shadow-evaluator.service";
import {
  brainV8ShadowMonitoringAuditFail,
  brainV8ShadowMonitoringPassCompleted,
  brainV8ShadowMonitoringPersistResult,
  brainV8ShadowMonitoringSnapshotFail,
  getBrainV8ShadowMonitoringSnapshot,
} from "./brain-v8-shadow-monitoring.service";
import type { BrainV8ShadowObservationResult } from "./brain-v8-shadow.types";
import { buildBrainV8ShadowVsCurrentComparison } from "./brain-v8-shadow-comparison.service";

const NS = "[brain:v8:shadow]";
const MAX_ROWS_PER_PASS = 24;

/**
 * Runs a read-only shadow pass over recent outcomes (via `buildBrainSnapshot`).
 * Safe to call from admin/cron; does not alter learning loops or stored outcomes.
 */
export async function runBrainV8ShadowObservationPass(): Promise<BrainV8ShadowObservationResult | null> {
  if (!oneBrainV8Flags.brainV8ShadowObservationV1) {
    return null;
  }
  if (!platformCoreFlags.platformCoreV1) {
    logWarn(NS, "platform core off — shadow observation skipped");
    return null;
  }

  let snapshot: Awaited<ReturnType<typeof buildBrainSnapshot>>;
  try {
    snapshot = await buildBrainSnapshot();
  } catch (e) {
    brainV8ShadowMonitoringSnapshotFail();
    logWarn(NS, "buildBrainSnapshot failed — shadow pass aborted (live brain unaffected)", {
      message: e instanceof Error ? e.message : String(e),
    });
    return null;
  }

  const notes: string[] = ["Shadow layer is evaluative only — no outcome rows updated."];
  const outcomes = snapshot.recentOutcomes.slice(0, MAX_ROWS_PER_PASS);
  if (snapshot.recentOutcomes.length > MAX_ROWS_PER_PASS) {
    logWarn(NS, "shadow_sample_capped", { cap: MAX_ROWS_PER_PASS, available: snapshot.recentOutcomes.length });
  }
  const rows = buildShadowRowsFromOutcomes(outcomes);
  const aggregate = aggregateShadowDeltas(rows);

  const result: BrainV8ShadowObservationResult = {
    observedAt: new Date().toISOString(),
    sampleSize: rows.length,
    rows,
    aggregate,
    notes,
  };

  /** Phase B — read-only shadow vs current comparison (structured log `[brain:v8:comparison]` only). */
  buildBrainV8ShadowVsCurrentComparison({ outcomesSlice: outcomes, shadowResult: result });

  brainV8ShadowMonitoringPassCompleted(result.sampleSize);

  logInfo(NS, {
    sampleSize: result.sampleSize,
    meanAbsDelta: result.aggregate.meanAbsDelta,
    reviewCount: result.aggregate.reviewCount,
    insufficientEvidenceCount: result.aggregate.insufficientEvidenceCount,
    monitoring: getBrainV8ShadowMonitoringSnapshot(),
  });

  if (result.sampleSize === 0) {
    logWarn(NS, "observation_empty_sample", { hint: "No recent outcomes in snapshot window — expected in cold environments." });
  }
  const mon = getBrainV8ShadowMonitoringSnapshot();
  if (mon.consecutiveEmptyPasses >= 3) {
    logWarn(NS, "observation_repeated_empty", { consecutiveEmptyPasses: mon.consecutiveEmptyPasses });
  }

  let persistOk: boolean | null = null;
  if (oneBrainV8Flags.brainV8ShadowPersistenceV1) {
    try {
      await prisma.brainShadowObservation.create({
        data: {
          sampleSize: result.sampleSize,
          shadowSummary: {
            aggregate: result.aggregate,
            observedAt: result.observedAt,
          } as object,
          diffNotes: {
            rowCount: rows.length,
            topReview: rows.filter((r) => r.shadowLabel === "review").slice(0, 8),
          } as object,
          metadata: {
            version: 1,
            weightsNote: snapshot.notes.slice(0, 3),
            monitoring: getBrainV8ShadowMonitoringSnapshot(),
          },
        },
      });
      persistOk = true;
      brainV8ShadowMonitoringPersistResult(true);
    } catch (e) {
      persistOk = false;
      brainV8ShadowMonitoringPersistResult(false);
      logWarn(NS, "shadow persistence failed", { message: e instanceof Error ? e.message : String(e) });
    }
  }

  if (oneBrainV8Flags.brainV8ShadowPersistenceV1 && persistOk === false) {
    logWarn(NS, "persistence_flag_on_but_write_failed", { monitoring: getBrainV8ShadowMonitoringSnapshot() });
  }

  if (isPlatformCoreAuditEffective()) {
    try {
      await createAuditEvent({
        eventType: PLATFORM_CORE_AUDIT.BRAIN_SHADOW_V8_OBSERVATION,
        source: "UNIFIED",
        entityType: "BRAIN",
        entityId: null,
        message: `Brain V8 shadow observation: n=${result.sampleSize} meanAbsDelta=${result.aggregate.meanAbsDelta}`,
        metadata: { aggregate: result.aggregate, sampleSize: result.sampleSize },
      });
    } catch (e) {
      brainV8ShadowMonitoringAuditFail();
      logWarn(NS, "audit log failed", { message: e instanceof Error ? e.message : String(e) });
    }
  }

  if (rows.length >= MAX_ROWS_PER_PASS) {
    logWarn(NS, "shadow_row_volume_at_cap", { n: rows.length, cap: MAX_ROWS_PER_PASS });
  }

  return result;
}
