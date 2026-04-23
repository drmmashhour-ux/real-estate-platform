import { prisma } from "@/lib/db";

export async function getNoShowAnalytics(input: { periodDays: number }): Promise<{
  noShowRate: number | null;
  confirmationProxyRate: number | null;
  rescheduleRecoveryCount: number;
  byBand: { band: string; count: number }[];
  bySource: { source: string; noShow: number; total: number }[];
  trendVisits: number;
}> {
  const since = new Date(Date.now() - input.periodDays * 86400000);
  const visits = await prisma.lecipmVisit.findMany({
    where: { createdAt: { gte: since } },
    include: { visitRequest: { select: { visitSource: true } } },
    take: 8000,
  });
  const noShows = visits.filter((v) => v.status === "no_show").length;
  const completed = visits.filter((v) => v.status === "completed").length;
  const noShowRate = visits.length > 0 ? noShows / visits.length : null;
  const reconfirmed = visits.filter((v) => v.reconfirmedAt != null).length;
  const confirmationProxyRate = visits.length > 0 ? reconfirmed / visits.length : null;

  const byBandMap: Record<string, number> = {};
  for (const v of visits) {
    const b = v.noShowRiskBand ?? "UNSET";
    byBandMap[b] = (byBandMap[b] ?? 0) + 1;
  }
  const byBand = Object.entries(byBandMap).map(([band, count]) => ({ band, count }));

  const bySourceMap: Record<string, { noShow: number; total: number }> = {};
  for (const v of visits) {
    const s = (v.visitRequest?.visitSource ?? "UNKNOWN").toString();
    if (!bySourceMap[s]) bySourceMap[s] = { noShow: 0, total: 0 };
    bySourceMap[s].total++;
    if (v.status === "no_show") bySourceMap[s].noShow++;
  }
  const bySource = Object.entries(bySourceMap).map(([source, o]) => ({ source, ...o }));

  const rescheduleRecoveryCount = await prisma.leadTimelineEvent.count({
    where: { eventType: "LECIPM_NSHOW_RESCHEDULED", createdAt: { gte: since } },
  });

  return {
    noShowRate,
    confirmationProxyRate,
    rescheduleRecoveryCount,
    byBand,
    bySource: bySource.sort((a, b) => b.total - a.total).slice(0, 10),
    trendVisits: visits.length,
  };
}

export async function getSettingsForVisit(brokerUserId: string): Promise<{ brokerTimeZone: string; maxVisitsPerDay: number }> {
  const s = await prisma.lecipmBrokerBookingSettings.findUnique({ where: { brokerUserId } });
  return {
    brokerTimeZone: s?.timeZone ?? "America/Toronto",
    maxVisitsPerDay: s?.maxVisitsPerDay ?? 4,
  };
}
