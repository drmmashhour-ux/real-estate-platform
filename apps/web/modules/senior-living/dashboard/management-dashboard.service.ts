/**
 * Multi-residence oversight — comparative table, light KPIs (not market-terminal).
 */
import { prisma } from "@/lib/db";
import type { ManagementDashboardPayload, ManagementKpis, ManagementResidenceRow } from "./dashboard.types";

function weekStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

export async function getManagementDashboardPayload(params: {
  userId: string;
  residenceIds: string[] | "all";
}): Promise<ManagementDashboardPayload> {
  const week = weekStart();

  const residenceFilter =
    params.residenceIds === "all"
      ? {}
      : ({ id: { in: params.residenceIds } } as const);

  const residences = await prisma.seniorResidence.findMany({
    where: residenceFilter,
    select: {
      id: true,
      name: true,
      city: true,
      units: { select: { available: true } },
      seniorOperatorPerformance: {
        select: {
          conversionRate: true,
          operatorScore: true,
          responseTimeAvg: true,
        },
      },
    },
    take: 80,
    orderBy: { name: "asc" },
  });

  const rows: ManagementResidenceRow[] = [];
  let leadsWeekSum = 0;
  let visitsWeekSum = 0;
  let totalUnits = 0;
  let availUnits = 0;

  for (const r of residences) {
    const [lw, vw] = await Promise.all([
      prisma.seniorLead.count({
        where: { residenceId: r.id, createdAt: { gte: week } },
      }),
      prisma.matchingEvent.count({
        where: {
          residenceId: r.id,
          eventType: "VISIT",
          createdAt: { gte: week },
        },
      }),
    ]);

    leadsWeekSum += lw;
    visitsWeekSum += vw;

    const tu = r.units.length || 1;
    const av = r.units.filter((u) => u.available).length;
    totalUnits += tu;
    availUnits += av;
    const occPct = Math.round(((tu - av) / tu) * 1000) / 10;

    const conv = r.seniorOperatorPerformance?.conversionRate ?? null;
    const rank = r.seniorOperatorPerformance?.operatorScore ?? null;
    const slow = (r.seniorOperatorPerformance?.responseTimeAvg ?? 0) > 24 * 3600;

    let alert: string | null = null;
    if (slow) alert = "Slow response vs peers";
    else if (occPct < 40 && lw > 2) alert = "Low occupancy with inbound demand — follow up";

    rows.push({
      residenceId: r.id,
      name: r.name,
      city: r.city,
      leadsWeek: lw,
      visitsWeek: vw,
      conversionRate: conv,
      occupancyPct: occPct,
      rankingScore: rank,
      alert,
    });
  }

  const closedWeek = await prisma.seniorLead.count({
    where: {
      status: "CLOSED",
      createdAt: { gte: week },
      ...(params.residenceIds === "all" ? {} : { residenceId: { in: params.residenceIds } }),
    },
  });

  const perfSample = await prisma.seniorOperatorPerformance.findMany({
    where:
      params.residenceIds === "all"
        ? {}
        : { residenceId: { in: params.residenceIds } },
    select: { responseTimeAvg: true },
    take: 100,
  });
  const rts = perfSample.map((p) => p.responseTimeAvg).filter((x): x is number => x != null);
  const avgRt =
    rts.length > 0 ? Math.round((rts.reduce((a, b) => a + b, 0) / rts.length / 3600) * 10) / 10 : null;

  const kpis: ManagementKpis = {
    totalResidences: residences.length,
    leadsWeek: leadsWeekSum,
    visitsBookedWeek: visitsWeekSum,
    moveInsOrConversionsWeek: closedWeek,
    avgResponseTimeHours: avgRt,
    avgOccupancyPct:
      totalUnits > 0 ? Math.round(((totalUnits - availUnits) / totalUnits) * 1000) / 10 : null,
  };

  const teamPerformance = [
    {
      label: "Portfolio response (avg)",
      value: avgRt != null ? `${avgRt} h` : "—",
      status: (avgRt ?? 0) > 12 ? ("watch" as const) : ("ok" as const),
    },
    {
      label: "Missed fast-follow risk",
      value: `${rows.filter((x) => x.alert?.includes("Slow")).length} residence(s)`,
      status: rows.some((x) => x.alert?.includes("Slow")) ? "watch" : "ok",
    },
    {
      label: "Conversion coverage",
      value: `${closedWeek} closes (7d)`,
      status: closedWeek === 0 && leadsWeekSum > 5 ? "risk" : "ok",
    },
  ];

  const occupancy = {
    totalAvailable: availUnits,
    totalUnits,
    byResidence: rows.slice(0, 12).map((r) => ({
      name: r.name,
      pct: r.occupancyPct ?? 0,
    })),
  };

  const demand = rows
    .map((r) => ({ residenceName: r.name, newLeadsWeek: r.leadsWeek }))
    .sort((a, b) => b.newLeadsWeek - a.newLeadsWeek)
    .slice(0, 8);

  const aiInsights: string[] = [];
  const weakest = [...rows].sort((a, b) => (a.rankingScore ?? 0) - (b.rankingScore ?? 0))[0];
  const strongest = [...rows].sort((a, b) => (b.leadsWeek ?? 0) - (a.leadsWeek ?? 0))[0];
  if (weakest && (weakest.rankingScore ?? 100) < 60) {
    aiInsights.push(`${weakest.name} may need coaching — ranking below peers.`);
  }
  if (strongest && strongest.leadsWeek > 0) {
    aiInsights.push(`Strongest demand signal: ${strongest.name} (${strongest.leadsWeek} leads this week).`);
  }
  if (avgRt != null && avgRt > 10) {
    aiInsights.push("Average response time rose — consider staffing or templates.");
  }
  if (aiInsights.length === 0) {
    aiInsights.push("Portfolio looks balanced — keep weekly lead reviews.");
  }

  const alerts: ManagementDashboardPayload["alerts"] = [];
  if (rows.some((r) => r.alert)) {
    alerts.push({
      id: "portfolio",
      severity: "warn",
      message: `${rows.filter((r) => r.alert).length} residence(s) flagged for review.`,
    });
  }

  return {
    role: "RESIDENCE_MANAGER",
    groupLabel: params.residenceIds === "all" ? "All residences" : "Your portfolio",
    kpis,
    residences: rows,
    teamPerformance,
    occupancy,
    demand,
    aiInsights: aiInsights.slice(0, 6),
    alerts,
    generatedAt: new Date().toISOString(),
  };
}
