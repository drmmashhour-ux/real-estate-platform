import type { PrismaClient } from "@prisma/client";
import { generateDailyInsights, type DailyInsightInput } from "../domain/dailyInsights";
import { generateDMVariants } from "../domain/dmVariants";
import { generateFollowUpMessage } from "../domain/outreachCopy";
import { OUTREACH_COACHING_STAGES, type OutreachCoachingStage } from "../domain/outreachStages";
import { parseVariantStats } from "../domain/variantStats";
import {
  bumpDailyMetric,
  getDailyMetricForDay,
  recordVariantEvent,
} from "../infrastructure/dailyMetricsRepository";
import { startOfUtcDay } from "../infrastructure/dailyTaskRepository";
import { generateDailyReport, type DailyTaskSnapshot } from "./generateDailyReport";
import { buildCoachingReminders, getTodayTasks } from "./dailyTaskService";

const FOLLOW_UP_MS = 24 * 60 * 60 * 1000;

export async function incrementReplies(db: PrismaClient, userId: string, delta = 1, date = new Date()) {
  const metricDate = startOfUtcDay(date);
  await bumpDailyMetric(db, userId, metricDate, "repliesReceived", delta);
}

export async function incrementCallsBooked(db: PrismaClient, userId: string, delta = 1, date = new Date()) {
  const metricDate = startOfUtcDay(date);
  await bumpDailyMetric(db, userId, metricDate, "callsBooked", delta);
}

export async function recordDmVariantUse(db: PrismaClient, userId: string, variant: string, date = new Date()) {
  await recordVariantEvent(db, userId, startOfUtcDay(date), variant, "use");
}

export async function recordDmVariantReply(db: PrismaClient, userId: string, variant: string, date = new Date()) {
  const metricDate = startOfUtcDay(date);
  await recordVariantEvent(db, userId, metricDate, variant, "reply");
  await bumpDailyMetric(db, userId, metricDate, "repliesReceived", 1);
}

export async function listFollowUpQueue(db: PrismaClient, brokerId: string) {
  const cutoff = new Date(Date.now() - FOLLOW_UP_MS);
  return db.lead.findMany({
    where: {
      introducedByBrokerId: brokerId,
      lastContactedAt: { not: null, lte: cutoff },
      pipelineStatus: { notIn: ["won", "lost"] },
      OR: [
        { outreachCoachingStage: { equals: null } },
        { outreachCoachingStage: "contacted" },
        { outreachCoachingStage: "follow_up_sent" },
      ],
    },
    orderBy: { lastContactedAt: "asc" },
    take: 40,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      lastContactedAt: true,
      outreachCoachingStage: true,
    },
  });
}

export async function getOutreachPipelineCounts(db: PrismaClient, brokerId: string): Promise<Record<string, number>> {
  const grouped = await db.lead.groupBy({
    by: ["outreachCoachingStage"],
    where: { introducedByBrokerId: brokerId },
    _count: true,
  });
  const counts: Record<string, number> = {
    uncategorized: 0,
    contacted: 0,
    replied: 0,
    follow_up_sent: 0,
    demo_booked: 0,
  };
  for (const g of grouped) {
    const key = g.outreachCoachingStage ?? "uncategorized";
    counts[key] = (counts[key] ?? 0) + g._count;
  }
  return counts;
}

export async function updateLeadOutreachStage(
  db: PrismaClient,
  brokerId: string,
  leadId: string,
  stage: OutreachCoachingStage | null
) {
  const lead = await db.lead.findFirst({
    where: { id: leadId, introducedByBrokerId: brokerId },
    select: { id: true },
  });
  if (!lead) return { ok: false as const, error: "Lead not found" };

  await db.lead.update({
    where: { id: leadId },
    data: { outreachCoachingStage: stage },
  });
  return { ok: true as const };
}

export async function buildDailyExecutionOverview(db: PrismaClient, userId: string, date = new Date()) {
  const { taskDate, tasks } = await getTodayTasks(db, userId, date);
  const metricDate = taskDate;
  const [metricRow, scripts, followUps, pipelineCounts] = await Promise.all([
    getDailyMetricForDay(db, userId, metricDate),
    db.dailyDmScript.findMany({ orderBy: { variant: "asc" } }),
    listFollowUpQueue(db, userId),
    getOutreachPipelineCounts(db, userId),
  ]);

  const msgTask = tasks.find((t) => t.taskType === "messages_sent");
  const callsTask = tasks.find((t) => t.taskType === "calls_booked");
  const onboardTask = tasks.find((t) => t.taskType === "users_onboarded");

  const messagesSent = Math.max(msgTask?.completedCount ?? 0, metricRow?.messagesSent ?? 0);
  const repliesReceived = metricRow?.repliesReceived ?? 0;
  const callsBooked = Math.max(callsTask?.completedCount ?? 0, metricRow?.callsBooked ?? 0);
  const usersOnboarded = Math.max(onboardTask?.completedCount ?? 0, metricRow?.usersOnboarded ?? 0);
  const variantStats = parseVariantStats(metricRow?.variantStats);

  const variants = generateDMVariants(
    scripts.map((s) => ({
      variant: s.variant,
      body: s.body,
      performanceScore: s.performanceScore,
    })),
    variantStats
  );

  const insightInput: DailyInsightInput = {
    messagesSent,
    repliesReceived,
    callsBooked,
    variantStats,
    followUpDueCount: followUps.length,
  };

  const snapshots: DailyTaskSnapshot[] = tasks.map((t) => ({
    taskType: t.taskType,
    targetCount: t.targetCount,
    completedCount: t.completedCount,
    repliesNote: t.repliesNote,
    metadata: t.metadata as DailyTaskSnapshot["metadata"],
  }));
  const dateLabel = metricDate.toISOString().slice(0, 10);
  const report = generateDailyReport(snapshots, dateLabel);

  const replyRate = messagesSent > 0 ? repliesReceived / messagesSent : null;
  const callRate = messagesSent > 0 ? callsBooked / messagesSent : null;

  let bestVariantLabel: string | null = null;
  let bestRate = -1;
  for (const v of variants) {
    if (v.uses < 1) continue;
    const r = v.replies / v.uses;
    if (r > bestRate) {
      bestRate = r;
      bestVariantLabel = `${v.label} — ${v.variantKey}`;
    }
  }

  return {
    metricDate: metricDate.toISOString().slice(0, 10),
    tasks: tasks.map((t) => ({
      id: t.id,
      taskType: t.taskType,
      targetCount: t.targetCount,
      completedCount: t.completedCount,
      status: t.status,
      metadata: t.metadata,
      repliesNote: t.repliesNote,
    })),
    metric: {
      messagesSent,
      repliesReceived,
      callsBooked,
      usersOnboarded,
      replyRate,
      callRate,
      bestVariantLabel,
    },
    variants,
    insights: generateDailyInsights(insightInput),
    followUp: {
      messageTemplate: generateFollowUpMessage(),
      leads: followUps,
    },
    pipeline: pipelineCounts,
    stageLabels: [...OUTREACH_COACHING_STAGES],
    reminders: buildCoachingReminders(tasks, new Date()),
    report,
  };
}
