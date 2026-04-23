import { prisma } from "@/lib/db";

/**
 * Lightweight aggregates from `LeadTimelineEvent` LECIPM_NSHOW_* rows (no ML).
 */
export async function getNoShowLearningSnapshot(): Promise<{
  reminders30d: number;
  confirmations30d: number;
  reschedules30d: number;
  riskRecalcs30d: number;
}> {
  const since = new Date(Date.now() - 30 * 86400000);
  const types = ["LECIPM_NSHOW_REMINDER_SENT", "LECIPM_NSHOW_CONFIRMATION_RECEIVED", "LECIPM_NSHOW_RESCHEDULED", "LECIPM_NSHOW_RISK_RECALC"];
  const rows = await prisma.leadTimelineEvent.groupBy({
    by: ["eventType"],
    where: { createdAt: { gte: since }, eventType: { in: types } },
    _count: true,
  });
  const map = new Map(rows.map((r) => [r.eventType, r._count]));
  return {
    reminders30d: map.get("LECIPM_NSHOW_REMINDER_SENT") ?? 0,
    confirmations30d: map.get("LECIPM_NSHOW_CONFIRMATION_RECEIVED") ?? 0,
    reschedules30d: map.get("LECIPM_NSHOW_RESCHEDULED") ?? 0,
    riskRecalcs30d: map.get("LECIPM_NSHOW_RISK_RECALC") ?? 0,
  };
}

export async function topRiskSourceMix(): Promise<{ source: string; visits: number }[]> {
  const since = new Date(Date.now() - 30 * 86400000);
  const vs = await prisma.lecipmVisit.findMany({
    where: { createdAt: { gte: since } },
    include: { visitRequest: { select: { visitSource: true } } },
    take: 5000,
  });
  const acc: Record<string, number> = {};
  for (const v of vs) {
    const s = (v.visitRequest?.visitSource ?? "UNKNOWN").toString();
    acc[s] = (acc[s] ?? 0) + 1;
  }
  return Object.entries(acc)
    .map(([source, visits]) => ({ source, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 8);
}
