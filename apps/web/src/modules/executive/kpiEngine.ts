import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { derivedRates } from "@/src/modules/messaging/learning/templatePerformance";
import { brokerResponseSlaMinutes, hostResponseSlaMinutes } from "@/src/modules/messaging/orchestration/orchestrationEnv";

export type ExecutiveKpiMetrics = Record<string, unknown>;

function utcDayStart(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function utcWeekStartMonday(d: Date): Date {
  const x = utcDayStart(d);
  const dow = x.getUTCDay();
  const diff = dow === 0 ? 6 : dow - 1;
  x.setUTCDate(x.getUTCDate() - diff);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

async function growthAiMetricsForRange(start: Date, end: Date): Promise<ExecutiveKpiMetrics> {
  const convWhere = { createdAt: { gte: start, lt: end } };
  const [
    totalConversations,
    withUserMsg,
    withAiReply,
    outcomeGroups,
    highIntentCount,
    highIntentBooked,
    stageGroups,
    msgsForTiming,
  ] = await Promise.all([
    prisma.growthAiConversation.count({ where: convWhere }),
    prisma.growthAiConversation.count({
      where: { ...convWhere, lastUserMessageAt: { not: null } },
    }),
    prisma.growthAiConversation.count({
      where: { ...convWhere, lastAiMessageAt: { not: null } },
    }),
    prisma.growthAiConversation.groupBy({
      by: ["outcome"],
      where: convWhere,
      _count: true,
    }),
    prisma.growthAiConversation.count({ where: { ...convWhere, highIntent: true } }),
    prisma.growthAiConversation.count({
      where: {
        ...convWhere,
        highIntent: true,
        outcome: "booked",
      },
    }),
    prisma.growthAiConversation.groupBy({
      by: ["stage"],
      where: convWhere,
      _count: true,
    }),
    prisma.growthAiConversation.findMany({
      where: convWhere,
      select: {
        id: true,
        createdAt: true,
        lastUserMessageAt: true,
        lastAiMessageAt: true,
        lastHumanMessageAt: true,
        assignedToId: true,
      },
      take: 800,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const outcomeMap = Object.fromEntries(outcomeGroups.map((g) => [g.outcome ?? "null", g._count]));
  const n = Math.max(1, totalConversations);
  const qualified = outcomeMap["qualified"] ?? 0;
  const booked = outcomeMap["booked"] ?? 0;
  const stale = outcomeMap["stale"] ?? 0;
  const handoff = outcomeMap["handoff"] ?? 0;

  let sumAiMs = 0;
  let aiSamples = 0;
  let sumHumanMs = 0;
  let humanSamples = 0;
  for (const c of msgsForTiming) {
    if (c.lastUserMessageAt && c.lastAiMessageAt && c.lastAiMessageAt >= c.lastUserMessageAt) {
      sumAiMs += c.lastAiMessageAt.getTime() - c.lastUserMessageAt.getTime();
      aiSamples++;
    }
    if (c.assignedToId && c.lastHumanMessageAt && c.lastUserMessageAt) {
      sumHumanMs += c.lastHumanMessageAt.getTime() - c.lastUserMessageAt.getTime();
      humanSamples++;
    }
  }

  const replyRate = withAiReply / Math.max(1, withUserMsg || totalConversations);
  const qualifiedRate = qualified / n;
  const bookedRate = booked / n;
  const staleRate = stale / n;
  const handoffRate = handoff / n;
  const highIntentRate = highIntentCount / n;
  const highIntentConversionRate = highIntentCount > 0 ? highIntentBooked / highIntentCount : 0;

  return {
    totalConversations,
    replyRate,
    qualifiedRate,
    bookedRate,
    staleRate,
    handoffRate,
    highIntentRate,
    highIntentConversionRate,
    averageTimeToFirstAiReplyMs: aiSamples ? sumAiMs / aiSamples : null,
    averageTimeToFirstHumanReplyMs: humanSamples ? sumHumanMs / humanSamples : null,
    outcomeBreakdown: outcomeMap,
    stageBreakdown: Object.fromEntries(stageGroups.map((g) => [g.stage, g._count])),
  };
}

async function orchestrationMetrics(): Promise<ExecutiveKpiMetrics> {
  let rows: {
    assignmentStatus: string;
    assignedAt: Date | null;
    assignedBrokerId: string | null;
    assignedHostId: string | null;
    conversationId: string;
  }[] = [];
  try {
    rows = await prisma.growthAiLeadOrchestration.findMany({
      select: {
        assignmentStatus: true,
        assignedAt: true,
        assignedBrokerId: true,
        assignedHostId: true,
        conversationId: true,
      },
    });
  } catch {
    return {
      totalOpenOrchestrations: 0,
      assignedRate: 0,
      contactedRate: 0,
      scheduledRate: 0,
      convertedRate: 0,
      reassignmentRate: 0,
      overdueAssignmentCount: 0,
      averageTimeToAssignmentMs: null,
    };
  }

  if (!rows.length) {
    return {
      totalOpenOrchestrations: 0,
      assignedRate: 0,
      contactedRate: 0,
      scheduledRate: 0,
      convertedRate: 0,
      reassignmentRate: 0,
      overdueAssignmentCount: 0,
      averageTimeToAssignmentMs: null,
    };
  }

  const open = rows.filter((r) => r.assignmentStatus !== "converted");
  const total = rows.length;
  const assigned = rows.filter((r) =>
    ["assigned", "contacted", "scheduled", "converted"].includes(r.assignmentStatus)
  ).length;
  const contacted = rows.filter((r) =>
    ["contacted", "scheduled", "converted"].includes(r.assignmentStatus)
  ).length;
  const scheduled = rows.filter((r) => ["scheduled", "converted"].includes(r.assignmentStatus)).length;
  const converted = rows.filter((r) => r.assignmentStatus === "converted").length;

  let reassignLogs = 0;
  try {
    reassignLogs = await prisma.growthAiActionLog.count({
      where: { actionType: { contains: "reassign" } },
    });
  } catch {
    reassignLogs = 0;
  }
  const reassignmentRate = total > 0 ? Math.min(1, reassignLogs / total) : 0;

  const now = Date.now();
  const bMin = brokerResponseSlaMinutes() * 60_000;
  const hMin = hostResponseSlaMinutes() * 60_000;
  let overdue = 0;
  let assignDeltaSum = 0;
  let assignDeltaN = 0;

  const convIds = [...new Set(rows.map((r) => r.conversationId))];
  const convs = await prisma.growthAiConversation.findMany({
    where: { id: { in: convIds } },
    select: { id: true, lastHumanMessageAt: true, createdAt: true },
  });
  const convMap = new Map(convs.map((c) => [c.id, c]));

  for (const r of rows) {
    if (r.assignedAt) {
      const c = convMap.get(r.conversationId);
      if (c) {
        assignDeltaSum += r.assignedAt.getTime() - c.createdAt.getTime();
        assignDeltaN++;
      }
    }
    if (!r.assignedAt || (!r.assignedBrokerId && !r.assignedHostId)) continue;
    const slaMs = r.assignedBrokerId ? bMin : hMin;
    const conv = convMap.get(r.conversationId);
    const humanAt = conv?.lastHumanMessageAt;
    const humanAfter = humanAt && humanAt >= r.assignedAt;
    if (!humanAfter && now - r.assignedAt.getTime() > slaMs) overdue++;
  }

  return {
    totalOpenOrchestrations: open.length,
    assignedRate: assigned / Math.max(1, total),
    contactedRate: contacted / Math.max(1, total),
    scheduledRate: scheduled / Math.max(1, total),
    convertedRate: converted / Math.max(1, total),
    reassignmentRate,
    overdueAssignmentCount: overdue,
    averageTimeToAssignmentMs: assignDeltaN ? assignDeltaSum / assignDeltaN : null,
  };
}

async function brokerHostSlaMetrics(): Promise<ExecutiveKpiMetrics> {
  const orch = await prisma.growthAiLeadOrchestration
    .findMany({
      where: {
        OR: [{ assignedBrokerId: { not: null } }, { assignedHostId: { not: null } }],
        assignedAt: { not: null },
      },
      include: {
        conversation: { select: { lastHumanMessageAt: true } },
      },
      take: 400,
    })
    .catch(() => []);

  const bMin = brokerResponseSlaMinutes() * 60_000;
  const hMin = hostResponseSlaMinutes() * 60_000;
  let brokerHits = 0;
  let brokerTotal = 0;
  let hostHits = 0;
  let hostTotal = 0;
  const now = Date.now();
  for (const o of orch) {
    const assignedAt = o.assignedAt!;
    const humanAt = o.conversation.lastHumanMessageAt;
    if (o.assignedBrokerId) {
      brokerTotal++;
      const respondedMs = humanAt ? humanAt.getTime() - assignedAt.getTime() : now - assignedAt.getTime();
      if (respondedMs <= bMin) brokerHits++;
    }
    if (o.assignedHostId) {
      hostTotal++;
      const respondedMs = humanAt ? humanAt.getTime() - assignedAt.getTime() : now - assignedAt.getTime();
      if (respondedMs <= hMin) hostHits++;
    }
  }

  return {
    brokerResponseSlaHitRate: brokerTotal ? brokerHits / brokerTotal : null,
    hostResponseSlaHitRate: hostTotal ? hostHits / hostTotal : null,
  };
}

async function templateLeaderboardSummary(): Promise<ExecutiveKpiMetrics> {
  const rows = await prisma.growthAiTemplatePerformance
    .findMany({
      where: { sentCount: { gte: 5 } },
      orderBy: { sentCount: "desc" },
      take: 40,
    })
    .catch(() => []);

  const scored = rows.map((r) => ({
    templateKey: r.templateKey,
    stage: r.stage,
    sentCount: r.sentCount,
    rates: derivedRates(r),
    weighted: derivedRates(r).bookedRate * 5 + derivedRates(r).qualifiedRate * 3 + derivedRates(r).replyRate * 2 - derivedRates(r).staleRate * 2 - derivedRates(r).handoffRate * 3,
  }));
  scored.sort((a, b) => b.weighted - a.weighted);
  const worst = [...scored].sort((a, b) => a.weighted - b.weighted).slice(0, 8);

  return {
    templateLeaderboardTop: scored.slice(0, 10),
    templateLeaderboardWorst: worst,
  };
}

async function objectionBreakdown(): Promise<Record<string, number>> {
  const rows = await prisma.growthAiConversationMessage
    .groupBy({
      by: ["detectedObjection"],
      where: { senderType: "user", createdAt: { gte: new Date(Date.now() - 90 * 86400000) } },
      _count: true,
    })
    .catch(() => []);
  return Object.fromEntries(rows.map((r) => [r.detectedObjection ?? "unknown", r._count]));
}

async function bookingSignals(start: Date, end: Date): Promise<ExecutiveKpiMetrics> {
  const [bookingCount, confirmed, revenueAgg, assistConvos, assistBooked] = await Promise.all([
    prisma.booking.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.booking.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        status: { in: ["CONFIRMED", "COMPLETED", "AWAITING_HOST_APPROVAL"] },
      },
      select: { totalCents: true },
      take: 50_000,
    }),
    prisma.booking.aggregate({
      where: { createdAt: { gte: start, lt: end } },
      _sum: { totalCents: true },
    }),
    prisma.growthAiConversation.count({
      where: {
        highIntentAssistNudgeSentAt: { not: null, gte: start, lt: end },
      },
    }),
    prisma.growthAiConversation.count({
      where: {
        highIntentAssistNudgeSentAt: { not: null, gte: start, lt: end },
        outcome: "booked",
      },
    }),
  ]);

  const estimatedRevenueCents = revenueAgg._sum.totalCents ?? 0;
  const bookingRecoveryAfterAssistRate = assistConvos > 0 ? assistBooked / assistConvos : null;

  return {
    bookingCount,
    confirmedBookingSampleCount: confirmed.length,
    estimatedRevenueCents,
    bookingRecoveryAfterAssistRate,
  };
}

/** City-level growth AI metrics from context_json (best-effort; missing city grouped as __unknown__). */
async function cityGrowthMetrics(start: Date, end: Date): Promise<ExecutiveKpiMetrics> {
  const convs = await prisma.growthAiConversation
    .findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { contextJson: true, outcome: true, highIntent: true },
      take: 5000,
    })
    .catch(() => []);

  const byCity: Record<string, { n: number; booked: number; stale: number; highIntent: number }> = {};
  for (const c of convs) {
    const ctx = (c.contextJson as { city?: string } | null) ?? {};
    const city = (ctx.city ?? "__unknown__").trim() || "__unknown__";
    if (!byCity[city]) byCity[city] = { n: 0, booked: 0, stale: 0, highIntent: 0 };
    byCity[city].n++;
    if (c.outcome === "booked") byCity[city].booked++;
    if (c.outcome === "stale") byCity[city].stale++;
    if (c.highIntent) byCity[city].highIntent++;
  }

  const rollup = Object.entries(byCity).map(([city, v]) => ({
    city,
    volume: v.n,
    bookedRate: v.n ? v.booked / v.n : 0,
    staleRate: v.n ? v.stale / v.n : 0,
    highIntentRate: v.n ? v.highIntent / v.n : 0,
  }));
  rollup.sort((a, b) => b.volume - a.volume);

  return {
    cityGrowthRollup: rollup.slice(0, 25),
  };
}

export async function computeDailyExecutiveKpis(targetDate?: Date): Promise<ExecutiveKpiMetrics> {
  const d = targetDate ?? new Date();
  const start = utcDayStart(d);
  const end = addDays(start, 1);

  const [messaging, orch, sla, templates, objections, bookings, cities] = await Promise.all([
    growthAiMetricsForRange(start, end),
    orchestrationMetrics(),
    brokerHostSlaMetrics(),
    templateLeaderboardSummary(),
    objectionBreakdown(),
    bookingSignals(start, end),
    cityGrowthMetrics(start, end),
  ]);

  return {
    period: { start: start.toISOString(), end: end.toISOString(), granularity: "daily" },
    messagingAndConversion: messaging,
    pipelineAndOrchestration: orch,
    brokerHostPerformance: sla,
    objectionBreakdown: objections,
    templatePerformance: templates,
    revenueAndBookingSignals: bookings,
    cityPerformance: cities,
  };
}

export async function computeWeeklyExecutiveKpis(weekStart?: Date): Promise<ExecutiveKpiMetrics> {
  const start = utcWeekStartMonday(weekStart ?? new Date());
  const end = addDays(start, 7);

  const [messaging, orch, sla, templates, objections, bookings, cities] = await Promise.all([
    growthAiMetricsForRange(start, end),
    orchestrationMetrics(),
    brokerHostSlaMetrics(),
    templateLeaderboardSummary(),
    objectionBreakdown(),
    bookingSignals(start, end),
    cityGrowthMetrics(start, end),
  ]);

  return {
    period: { start: start.toISOString(), end: end.toISOString(), granularity: "weekly" },
    messagingAndConversion: messaging,
    pipelineAndOrchestration: orch,
    brokerHostPerformance: sla,
    objectionBreakdown: objections,
    templatePerformance: templates,
    revenueAndBookingSignals: bookings,
    cityPerformance: cities,
  };
}

export async function buildExecutiveKpiSnapshot(
  snapshotType: "daily" | "weekly",
  snapshotDate: Date
): Promise<{ snapshotType: string; snapshotDate: Date; metricsJson: Prisma.InputJsonValue }> {
  const metrics =
    snapshotType === "weekly"
      ? await computeWeeklyExecutiveKpis(snapshotDate)
      : await computeDailyExecutiveKpis(snapshotDate);
  const anchor = snapshotType === "weekly" ? utcWeekStartMonday(snapshotDate) : utcDayStart(snapshotDate);
  return {
    snapshotType,
    snapshotDate: anchor,
    metricsJson: metrics as Prisma.InputJsonValue,
  };
}

export async function saveExecutiveKpiSnapshot(input: {
  snapshotType: string;
  snapshotDate: Date;
  metricsJson: Prisma.InputJsonValue;
}): Promise<{ id: string }> {
  await prisma.executiveKpiSnapshot.deleteMany({
    where: {
      snapshotType: input.snapshotType,
      snapshotDate: input.snapshotDate,
    },
  });
  const row = await prisma.executiveKpiSnapshot.create({
    data: {
      snapshotType: input.snapshotType,
      snapshotDate: input.snapshotDate,
      metricsJson: input.metricsJson,
    },
  });
  return { id: row.id };
}
