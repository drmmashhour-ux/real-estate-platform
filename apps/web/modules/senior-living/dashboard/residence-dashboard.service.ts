/**
 * Single-residence operator workspace — calm, action-first aggregates.
 */
import { prisma } from "@/lib/db";
import { getLatestScoresForLeads } from "@/modules/senior-living/lead-scoring.service";
import type { LeadBand } from "@/modules/senior-living/lead-scoring.service";
import type {
  ResidenceAvailability,
  ResidenceDashboardPayload,
  ResidenceKpis,
  ResidenceLeadQueueItem,
  ResidencePerformance,
  ResidenceVisitItem,
} from "./dashboard.types";

function weekStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

export async function getResidenceDashboardPayload(params: {
  residenceId: string;
  operatorUserId: string;
  isAdminPreview?: boolean;
}): Promise<ResidenceDashboardPayload | null> {
  const whereOp =
    params.isAdminPreview ? { id: params.residenceId } : { id: params.residenceId, operatorId: params.operatorUserId };

  const residence = await prisma.seniorResidence.findFirst({
    where: whereOp,
    include: {
      units: { select: { available: true } },
      seniorOperatorPerformance: true,
      leads: {
        where: { createdAt: { gte: weekStart() } },
        select: { id: true },
      },
    },
  });

  if (!residence) return null;

  const week = weekStart();
  const [leadsWeek, leadsWeekIds, leadsAllRecent, visitsWeek, perf] = await Promise.all([
    prisma.seniorLead.count({
      where: { residenceId: residence.id, createdAt: { gte: week } },
    }),
    prisma.seniorLead.findMany({
      where: { residenceId: residence.id, createdAt: { gte: week } },
      select: { id: true },
    }),
    prisma.seniorLead.findMany({
      where: { residenceId: residence.id },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        requesterName: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.matchingEvent.count({
      where: {
        residenceId: residence.id,
        eventType: "VISIT",
        createdAt: { gte: week },
      },
    }),
    prisma.seniorOperatorPerformance.findUnique({
      where: { residenceId: residence.id },
    }),
  ]);

  const ids = leadsAllRecent.map((l) => l.id);
  const scores = await getLatestScoresForLeads(ids);
  const weekScores = await getLatestScoresForLeads(leadsWeekIds.map((x) => x.id));
  let highPri = 0;
  for (const wid of leadsWeekIds) {
    const b = weekScores.get(wid.id)?.band;
    if ((b as LeadBand | undefined) === "HIGH") highPri++;
  }
  const queue: ResidenceLeadQueueItem[] = [];
  for (const l of leadsAllRecent) {
    const s = scores.get(l.id);
    const hoursSince = (Date.now() - l.createdAt.getTime()) / 3600000;
    const needsFollowUp =
      (l.status === "NEW" && hoursSince > 4) || (l.status === "CONTACTED" && hoursSince > 72);
    queue.push({
      id: l.id,
      requesterName: l.requesterName,
      status: l.status,
      band: s?.band ?? null,
      score: s?.score ?? null,
      createdAt: l.createdAt.toISOString(),
      needsFollowUp,
    });
  }

  const totalUnits = residence.units.length;
  const availableUnits = residence.units.filter((u) => u.available).length;
  const occupiedUnits = totalUnits - availableUnits;

  const upcoming = await prisma.matchingEvent.findMany({
    where: { residenceId: residence.id, eventType: "VISIT" },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const visitItems = (rows: typeof upcoming): ResidenceVisitItem[] =>
    rows.map((e) => ({
      id: e.id,
      createdAt: e.createdAt.toISOString(),
      label: "Visit activity",
    }));

  const availability: ResidenceAvailability = {
    availableUnits,
    occupiedUnits,
    totalUnits: totalUnits || 1,
  };

  const performance: ResidencePerformance = {
    responseTimeHours:
      perf?.responseTimeAvg != null ? Math.round((perf.responseTimeAvg / 3600) * 10) / 10 : null,
    conversionRate: perf?.conversionRate ?? null,
    operatorScore: perf?.operatorScore ?? null,
    trustScore: perf?.trustScore ?? null,
    profileCompleteness: perf?.profileCompleteness ?? null,
    rankHint:
      (perf?.operatorScore ?? 0) < 55 ? "Improve response time and profile completeness to climb rankings."
      : null,
  };

  const kpis: ResidenceKpis = {
    newLeadsWeek: leadsWeek,
    highPriorityLeads: highPri,
    visitsBookedWeek: visitsWeek,
    availableUnits,
    totalUnits: totalUnits || 1,
  };

  const alerts: ResidenceDashboardPayload["alerts"] = [];
  if (queue.some((q) => q.needsFollowUp)) {
    alerts.push({
      id: "follow-up",
      severity: "warn",
      message: `${queue.filter((q) => q.needsFollowUp).length} lead(s) need a follow-up.`,
    });
  }
  if (!residence.verified) {
    alerts.push({
      id: "verify",
      severity: "info",
      message: "Verification pending — complete documents to earn the verified badge.",
    });
  }

  const aiSuggestions: string[] = [];
  if ((performance.responseTimeHours ?? 0) > 8) {
    aiSuggestions.push("Respond faster — families compare operators on first reply time.");
  }
  if ((performance.profileCompleteness ?? 100) < 70) {
    aiSuggestions.push("Complete missing profile fields (services, photos) to improve trust.");
  }
  if (availableUnits > totalUnits * 0.4) {
    aiSuggestions.push("You have availability — highlight units in your public listing.");
  }
  if (aiSuggestions.length === 0) {
    aiSuggestions.push("Keep response times under 4 hours on new leads to protect ranking.");
  }

  return {
    role: "RESIDENCE_OPERATOR",
    residence: {
      id: residence.id,
      name: residence.name,
      city: residence.city,
      verified: residence.verified,
    },
    kpis,
    leadQueue: queue.slice(0, 15),
    visits: {
      upcoming: visitItems(upcoming.slice(0, 5)),
      recent: visitItems(upcoming.slice(0, 8)),
    },
    availability,
    performance,
    aiSuggestions: aiSuggestions.slice(0, 5),
    alerts,
    generatedAt: new Date().toISOString(),
  };
}
