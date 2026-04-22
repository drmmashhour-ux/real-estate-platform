/**
 * Platform command center — uses existing command data, presented for operations (not a trading floor).
 */
import { prisma } from "@/lib/db";
import {
  getActivityFeed,
  getAreaInsights,
  getCommandAlerts,
  getHotLeads,
  getOperatorSummaries,
  getSeniorCommandKpis,
  getStuckDeals,
} from "@/modules/senior-living/command/senior-command.service";
import { getLatestScoresForLeads } from "@/modules/senior-living/lead-scoring.service";
import type { AdminDashboardPayload } from "./dashboard.types";

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function getAdminDashboardPayload(): Promise<AdminDashboardPayload> {
  const [
    kpisRaw,
    hotRaw,
    stuckRaw,
    areas,
    ops,
    activity,
    cmdAlerts,
    funnel,
    citiesCount,
    pendingActions,
  ] = await Promise.all([
    getSeniorCommandKpis(),
    getHotLeads(14),
    getStuckDeals(16),
    getAreaInsights(),
    getOperatorSummaries(),
    getActivityFeed(28),
    getCommandAlerts(),
    prisma.seniorLead.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
    }),
    prisma.seniorCity.count().catch(() => 0),
    prisma.autonomousActionLog.findMany({
      where: { executedAt: null },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        actionType: true,
        status: true,
        reason: true,
      },
    }).catch(() => []),
  ]);

  const leadsToday = await prisma.seniorLead.count({
    where: { createdAt: { gte: startOfDay(new Date()) } },
  });

  const recentIds = (
    await prisma.seniorLead.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      select: { id: true },
      take: 300,
    })
  ).map((x) => x.id);
  const scoreMap = await getLatestScoresForLeads(recentIds);
  let hq = 0;
  let scored = 0;
  for (const id of recentIds) {
    const s = scoreMap.get(id);
    if (!s) continue;
    scored++;
    if (String(s.band).toUpperCase() === "HIGH") hq++;
  }
  const highQualityLeadRatio = scored > 0 ? Math.round((1000 * hq) / scored) / 10 : null;

  const operatorCount = await prisma.seniorResidence.findMany({
    where: { operatorId: { not: null } },
    distinct: ["operatorId"],
    select: { operatorId: true },
  });

  const avgRespAll = await prisma.seniorOperatorPerformance.findMany({
    select: { responseTimeAvg: true },
    take: 200,
  });
  const rts = avgRespAll.map((x) => x.responseTimeAvg).filter((x): x is number => x != null);
  const avgH = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length / 3600 : null;
  const responseSlaOk = avgH != null ? avgH <= 12 : true;

  const residencesN = await prisma.seniorResidence.count();
  const leads30 = await prisma.seniorLead.count({
    where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
  });
  const supplyDemandIndex = leads30 > 0 ? residencesN / leads30 : null;

  const buckets = await prisma.seniorLeadScore.groupBy({
    by: ["band"],
    _count: { id: true },
    where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
  }).catch(() => []);

  const funnelMap = Object.fromEntries(funnel.map((f) => [f.status, f._count.id]));
  const marketplaceHealth = {
    supplyDemandIndex,
    leadQualityBuckets: buckets.map((b) => ({ label: b.band || "—", count: b._count.id })),
    avgResponseHours: avgH != null ? Math.round(avgH * 10) / 10 : null,
    conversionFunnel: {
      new: funnelMap.NEW ?? 0,
      contacted: funnelMap.CONTACTED ?? 0,
      closed: funnelMap.CLOSED ?? 0,
    },
  };

  const cities: AdminDashboardPayload["cities"] = areas.slice(0, 12).map((a) => ({
    city: a.city,
    leads: a.leads,
    signal: a.demandSignal === "high" ? ("strong" as const) : a.demandSignal === "mid" ? ("ok" as const) : ("weak" as const),
    note:
      a.supplySignal === "tight" ? "Supply tight — recruit operators"
      : a.demandSignal === "high" ? "Healthy demand"
      : "Monitor conversion",
  }));

  const operators: AdminDashboardPayload["operators"] = ops.slice(0, 20).map((o) => ({
    operatorId: o.operatorId,
    name: o.operatorName,
    residences: o.residenceCount,
    score: o.rankingScore,
    status:
      o.tier === "green" ? ("top" as const)
      : o.tier === "red" ? ("watch" as const)
      : ("ok" as const),
  }));

  const alerts: AdminDashboardPayload["alerts"] = cmdAlerts.map((a) => ({
    id: a.id,
    severity: a.severity === "critical" ? ("urgent" as const) : a.severity === "warning" ? ("warn" as const) : ("info" as const),
    message: a.message,
  }));

  const aiActions: string[] = [];
  if (pendingActions.length > 0) {
    aiActions.push(`${pendingActions.length} autonomy action(s) awaiting review.`);
  }
  if ((marketplaceHealth.supplyDemandIndex ?? 0) < 0.4) {
    aiActions.push("Supply looks thin vs demand — prioritize operator recruitment in hot cities.");
  }
  const bestCity = cities[0];
  if (bestCity) aiActions.push(`Strongest corridor recently: ${bestCity.city} (${bestCity.leads} leads in view).`);

  return {
    role: "PLATFORM_ADMIN",
    kpis: {
      leadsToday,
      highQualityLeadRatio,
      activeOperators: operatorCount.filter((o) => o.operatorId != null).length,
      responseSlaOk,
      revenueTodayCad: kpisRaw.revenueDailyCad,
      revenueMonthCad: kpisRaw.revenueMonthlyCad,
      activeCities: citiesCount,
    },
    marketplaceHealth,
    hotLeads: hotRaw.slice(0, 10).map((h) => ({
      id: h.id,
      requesterName: h.requesterName,
      residenceName: h.residenceName,
      city: h.residenceCity,
      band: h.band,
    })),
    stuckCases: stuckRaw.slice(0, 10).map((s) => ({
      leadId: s.leadId,
      residenceName: s.residenceName,
      city: s.city,
      issue: s.issue,
    })),
    cities,
    operators,
    approvals: pendingActions.map((p) => ({
      id: p.id,
      kind: p.actionType,
      title: p.reason.slice(0, 80),
      status: p.status,
    })),
    activityFeed: activity.map((a) => ({ at: a.at, label: a.label })),
    alerts,
    aiActions: aiActions.slice(0, 8),
    generatedAt: new Date().toISOString(),
  };
}
