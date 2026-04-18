/**
 * Manual / staging backfill from real growth_events rows (idempotent where unique keys allow).
 */
import { prisma } from "@/lib/db";
import { croRetargetingDurabilityFlags, croRetargetingLearningFlags } from "@/config/feature-flags";
import { persistLearningSignalsFromGrowthEvent } from "./growth-persist-from-tracking.service";
import { persistNegativeSignalSnapshotsFromDetection } from "./negative-signal-persistence.service";
import { GrowthEventName } from "./event-types";

export async function backfillCroLearningSignalsFromRecentEvents(rangeDays = 14): Promise<{
  processed: number;
  warnings: string[];
}> {
  const warnings: string[] = [];
  if (!croRetargetingLearningFlags.croRetargetingPersistenceV1 && !croRetargetingDurabilityFlags.croRetargetingDurabilityV1) {
    warnings.push("Persistence flags off — no backfill.");
    return { processed: 0, warnings };
  }
  const since = new Date(Date.now() - rangeDays * 864e5);
  const rows = await prisma.growthEvent.findMany({
    where: {
      createdAt: { gte: since },
      eventName: { in: [GrowthEventName.LEAD_CAPTURE, GrowthEventName.BOOKING_STARTED, GrowthEventName.BOOKING_COMPLETED] },
    },
    select: { id: true, eventName: true, userId: true, sessionId: true, metadata: true },
    take: 2000,
    orderBy: { createdAt: "desc" },
  });
  let processed = 0;
  for (const r of rows) {
    const meta =
      r.metadata && typeof r.metadata === "object" && !Array.isArray(r.metadata)
        ? (r.metadata as Record<string, unknown>)
        : {};
    await persistLearningSignalsFromGrowthEvent({
      growthEventId: r.id,
      eventName: r.eventName,
      userId: r.userId,
      sessionId: r.sessionId,
      metadata: meta,
    });
    processed += 1;
  }
  return { processed, warnings };
}

export async function backfillRetargetingLearningSignalsFromRecentEvents(rangeDays = 14): Promise<{
  processed: number;
  warnings: string[];
}> {
  return backfillCroLearningSignalsFromRecentEvents(rangeDays);
}

export async function backfillRetargetingPerformanceFromRecentEvents(rangeDays = 14): Promise<{
  ok: boolean;
  warnings: string[];
}> {
  void rangeDays;
  const warnings: string[] = [
    "Performance counters hydrate from DB snapshots via retargeting-performance.service — re-run app traffic instead of replaying events here.",
  ];
  return { ok: true, warnings };
}

export async function runNegativeSignalDetectionBackfill(rangeDays = 14): Promise<{
  croUpserted: number;
  retargetingUpserted: number;
  warnings: string[];
}> {
  return persistNegativeSignalSnapshotsFromDetection(rangeDays);
}
