/**
 * Platform Core V2 — scheduled re-evaluation hooks (monitoring / weak signals / retry reminders).
 */
import { prisma } from "@/lib/db";
import { logWarn } from "@/lib/logger";
import { platformCoreFlags } from "@/config/feature-flags";
import { PLATFORM_CORE_AUDIT } from "./platform-core.constants";
import { appendLifecycleEvent, createAuditEvent } from "./platform-core.repository";
import { isPlatformCoreAuditEffective } from "@/config/feature-flags";

export async function scheduleDecisionReevaluation(decisionId: string, delayHours: number, reason?: string): Promise<void> {
  if (!platformCoreFlags.platformCoreV1 || !platformCoreFlags.platformCoreSchedulerV1) {
    return;
  }
  const hours = Math.max(0.25, delayHours);
  const nextRunAt = new Date(Date.now() + hours * 3600 * 1000);

  try {
    await prisma.platformCoreDecisionSchedule.deleteMany({ where: { decisionId } });
    await prisma.platformCoreDecisionSchedule.create({
      data: {
        decisionId,
        nextRunAt,
        reason: reason ?? `Re-eval after ${hours}h`,
        metadata: { scheduledBy: "platform_core_scheduler_v1" },
      },
    });

    if (isPlatformCoreAuditEffective()) {
      await createAuditEvent({
        eventType: PLATFORM_CORE_AUDIT.SCHEDULER_REEVAL,
        source: "UNIFIED",
        entityType: "UNKNOWN",
        entityId: null,
        message: `Scheduled re-evaluation for ${decisionId} at ${nextRunAt.toISOString()}`,
        metadata: { decisionId, nextRunAt: nextRunAt.toISOString(), delayHours: hours },
      });
    }
  } catch (e) {
    logWarn("[platform-core:scheduler]", "scheduleDecisionReevaluation_failed", {
      decisionId,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function getDueDecisions(now = new Date()): Promise<{ id: string; decisionId: string; nextRunAt: Date }[]> {
  if (!platformCoreFlags.platformCoreV1 || !platformCoreFlags.platformCoreSchedulerV1) {
    return [];
  }
  const rows = await prisma.platformCoreDecisionSchedule.findMany({
    where: { nextRunAt: { lte: now } },
    orderBy: { nextRunAt: "asc" },
    take: 200,
  });
  return rows.map((r) => ({ id: r.id, decisionId: r.decisionId, nextRunAt: r.nextRunAt }));
}

/**
 * Marks due schedules as processed: audit + lifecycle checkpoint, then removes the row (or operator may reschedule).
 */
export async function runScheduledEvaluations(now = new Date()): Promise<{ processed: number }> {
  if (!platformCoreFlags.platformCoreV1 || !platformCoreFlags.platformCoreSchedulerV1) {
    return { processed: 0 };
  }
  const due = await getDueDecisions(now);
  let processed = 0;
  for (const row of due) {
    try {
      await appendLifecycleEvent(row.decisionId, "REEVAL_DUE", "Scheduled platform-core re-evaluation window");
      if (isPlatformCoreAuditEffective()) {
        await createAuditEvent({
          eventType: PLATFORM_CORE_AUDIT.SCHEDULER_REEVAL,
          source: "UNIFIED",
          entityType: "UNKNOWN",
          entityId: null,
          message: `Re-eval due for decision ${row.decisionId}`,
          metadata: { decisionId: row.decisionId, scheduleId: row.id },
        });
      }
      await prisma.platformCoreDecisionSchedule.delete({ where: { id: row.id } });
      processed += 1;
    } catch (e) {
      logWarn("[platform-core:scheduler]", "runScheduledEvaluations_row_failed", {
        scheduleId: row.id,
        decisionId: row.decisionId,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return { processed };
}
