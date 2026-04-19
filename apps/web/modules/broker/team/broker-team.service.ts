/**
 * Broker team aggregation — combines performance engine signals with CRM timestamps (read-only).
 */

import { prisma } from "@/lib/db";
import type { LeadClosingStage } from "@/modules/broker/closing/broker-closing.types";
import { deriveLeadClosingStageFromRow } from "@/modules/broker/closing/broker-closing-state.service";
import {
  computeBrokerPerformanceMetricsInputFromLeads,
  type BrokerPerformanceLeadRow,
} from "@/modules/broker/performance/broker-performance.service";
import { scoreBrokerPerformanceMetrics } from "@/modules/broker/performance/broker-performance-scoring.service";
import { buildBrokerPerformanceInsights } from "@/modules/broker/performance/broker-performance-insights.service";
import { buildBrokerPerformanceEngineSnapshot } from "@/modules/broker/performance/broker-performance-engine.service";
import type { BrokerPerformanceInsight } from "@/modules/broker/performance/broker-performance.types";
import { buildBrokerIncentiveSummary } from "@/modules/broker/incentives/broker-incentives-summary.service";
import { brokerAiAssistFlags } from "@/config/feature-flags";

import type {
  BrokerTeamDashboardPayload,
  BrokerTeamManagerBrokerDetail,
  BrokerTeamPipelineStageCount,
  BrokerTeamRow,
  BrokerTeamSummary,
} from "./broker-team.types";
import {
  assignBrokerTeamRiskLevel,
  inactiveDaysFromLastTouchMs,
  type BrokerTeamLeadRiskContext,
} from "./broker-team-risk.service";
import { buildBrokerTeamInsights } from "./broker-team-insights.service";
import {
  recordBrokerTeamBrokerDetailOpened,
  recordBrokerTeamDashboardViewed,
  recordBrokerTeamInsightsGenerated,
} from "./broker-team-monitoring.service";

const MS_DAY = 86400000;

const DISCLAIMER =
  "Internal coaching visibility only — not shown to brokers as rankings, not used for penalties, not an autopilot layer. Interpret scores as directional telemetry with sample-size limits.";

function pickStrengthWeakness(insights: BrokerPerformanceInsight[]): { strength: string; weakness: string } {
  const strengths = insights.filter((i) => i.type === "strength");
  const weaknesses = insights.filter((i) => i.type === "weakness" || i.type === "data_quality");
  return {
    strength: strengths[0]?.label ?? "—",
    weakness: weaknesses[0]?.label ?? "—",
  };
}

function touchMs(l: BrokerPerformanceLeadRow): number {
  return Math.max(
    0,
    ...[l.firstContactAt, l.lastContactAt, l.lastContactedAt, l.lastFollowUpAt, l.wonAt]
      .filter(Boolean)
      .map((d) => (d as Date).getTime()),
  );
}

function idleHoursLead(
  lead: { lastContactAt: Date | null; lastContactedAt: Date | null; createdAt: Date },
  nowMs: number,
): number {
  const t = lead.lastContactAt ?? lead.lastContactedAt ?? lead.createdAt;
  return (nowMs - t.getTime()) / (60 * 60 * 1000);
}

function isRespondedPlus(stage: LeadClosingStage): boolean {
  return (
    stage === "responded" ||
    stage === "meeting_scheduled" ||
    stage === "negotiation" ||
    stage === "closed_won" ||
    stage === "closed_lost"
  );
}

export type TeamLeadRollup = {
  leadsActive: number;
  followUpsOverdue: number;
  stalledAfterContact: number;
  lastTouchMs: number;
};

/** Single pass extensions for manager table (same lead array as performance aggregate). */
export function computeTeamLeadRollup(leads: BrokerPerformanceLeadRow[], nowMs: number): TeamLeadRollup {
  let leadsActive = 0;
  let followUpsOverdue = 0;
  let stalledAfterContact = 0;
  let lastTouchMs = 0;

  for (const lead of leads) {
    const stage = deriveLeadClosingStageFromRow(lead);
    if (stage !== "closed_won" && stage !== "closed_lost") {
      leadsActive += 1;
    }

    const idleH = idleHoursLead(lead, nowMs);
    if (stage === "contacted" && !isRespondedPlus(stage) && idleH >= 72) {
      followUpsOverdue += 1;
      stalledAfterContact += 1;
    }

    lastTouchMs = Math.max(lastTouchMs, touchMs(lead));
  }

  return { leadsActive, followUpsOverdue, stalledAfterContact, lastTouchMs };
}

function compareTeamRowsSupportFirst(a: BrokerTeamRow, b: BrokerTeamRow): number {
  const rk = (r: BrokerTeamRow) => (r.riskLevel === "high" ? 0 : r.riskLevel === "medium" ? 1 : 2);
  if (rk(a) !== rk(b)) return rk(a) - rk(b);
  if (b.followUpsOverdue !== a.followUpsOverdue) return b.followUpsOverdue - a.followUpsOverdue;
  return a.displayName.localeCompare(b.displayName);
}

export async function buildBrokerTeamDashboardPayload(options?: {
  maxBrokers?: number;
  nowMs?: number;
}): Promise<BrokerTeamDashboardPayload> {
  const max = Math.min(options?.maxBrokers ?? 48, 120);
  const nowMs = options?.nowMs ?? Date.now();

  const brokers = await prisma.user.findMany({
    where: { role: "BROKER", accountStatus: "ACTIVE" },
    select: { id: true, name: true, email: true },
    take: max,
    orderBy: { createdAt: "desc" },
  });

  const rows: BrokerTeamRow[] = [];

  let sumScore = 0;
  let sumConv = 0;
  let activeBrokers = 0;
  let sumOverdueRatio = 0;

  for (const b of brokers) {
    const leads = (await prisma.lead.findMany({
      where: {
        OR: [{ introducedByBrokerId: b.id }, { lastFollowUpByBrokerId: b.id }],
      },
      select: {
        aiExplanation: true,
        pipelineStage: true,
        pipelineStatus: true,
        wonAt: true,
        lostAt: true,
        contactUnlockedAt: true,
        firstContactAt: true,
        lastContactedAt: true,
        lastContactAt: true,
        dmStatus: true,
        engagementScore: true,
        lastFollowUpAt: true,
        createdAt: true,
        meetingScheduledAt: true,
        meetingAt: true,
      },
      take: 500,
    })) as BrokerPerformanceLeadRow[];

    const rawInput = computeBrokerPerformanceMetricsInputFromLeads(b.id, leads, nowMs);
    const metrics = scoreBrokerPerformanceMetrics(rawInput);
    const insights = buildBrokerPerformanceInsights(metrics);
    const { strength, weakness } = pickStrengthWeakness(insights);

    const rollup = computeTeamLeadRollup(leads, nowMs);
    const inactiveDays = inactiveDaysFromLastTouchMs(rollup.lastTouchMs, nowMs);
    if (inactiveDays < 7) activeBrokers += 1;

    const riskCtx: BrokerTeamLeadRiskContext = {
      followUpsOverdue: rollup.followUpsOverdue,
      stalledAfterContact: rollup.stalledAfterContact,
      inactiveDaysApprox: inactiveDays,
    };
    const { riskLevel } = assignBrokerTeamRiskLevel(metrics, riskCtx, nowMs);

    const displayName = (b.name?.trim() || b.email?.trim() || "Broker").slice(0, 120);
    const lastIso = rollup.lastTouchMs > 0 ? new Date(rollup.lastTouchMs).toISOString() : null;

    rows.push({
      brokerId: b.id,
      displayName,
      performanceScore: metrics.overallScore,
      band: metrics.executionBand,
      leadsAssigned: metrics.leadsAssigned,
      leadsActive: rollup.leadsActive,
      followUpsDue: metrics.followUpsDue,
      followUpsOverdue: rollup.followUpsOverdue,
      lastActiveAt: lastIso,
      riskLevel,
      topStrength: strength,
      topWeakness: weakness,
    });

    sumScore += metrics.overallScore;
    const conv = metrics.leadsAssigned > 0 ? metrics.wonDeals / metrics.leadsAssigned : 0;
    sumConv += conv;
    sumOverdueRatio += rollup.followUpsOverdue / Math.max(1, metrics.leadsAssigned);
  }

  const n = brokers.length;
  const summary: BrokerTeamSummary = {
    totalBrokers: n,
    activeBrokers,
    inactiveBrokers: Math.max(0, n - activeBrokers),
    avgPerformanceScore: n > 0 ? Math.round(sumScore / n) : 0,
    avgConversionRate: n > 0 ? sumConv / n : 0,
    followUpHealth:
      n > 0 && sumOverdueRatio / n < 0.06
        ? "good"
        : n > 0 && sumOverdueRatio / n < 0.14
          ? "moderate"
          : "poor",
  };

  const sufficientRows = rows.filter((r) => r.band !== "insufficient_data");
  const topPerformers = [...sufficientRows].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5);

  const supportPriorityBrokers = [...rows].sort(compareTeamRowsSupportFirst).slice(0, 6);

  const inactiveBrokers = rows.filter((r) => {
    if (!r.lastActiveAt) return true;
    const days = Math.floor((nowMs - Date.parse(r.lastActiveAt)) / MS_DAY);
    return days >= 7;
  });

  const insights = buildBrokerTeamInsights({ summary, rows });

  try {
    recordBrokerTeamDashboardViewed({ brokerCount: rows.length });
    recordBrokerTeamInsightsGenerated(insights.length);
  } catch {
    /* ignore */
  }

  return {
    summary,
    rows,
    topPerformers,
    supportPriorityBrokers,
    inactiveBrokers,
    insights,
    disclaimer: DISCLAIMER,
    generatedAt: new Date(nowMs).toISOString(),
  };
}

export async function buildBrokerTeamManagerDetail(
  brokerId: string,
  options?: { nowMs?: number; emitMonitoring?: boolean },
): Promise<BrokerTeamManagerBrokerDetail | null> {
  const nowMs = options?.nowMs ?? Date.now();
  const emitMon = options?.emitMonitoring !== false;

  const user = await prisma.user.findUnique({
    where: { id: brokerId },
    select: { role: true, name: true, email: true },
  });
  if (!user || user.role !== "BROKER") return null;

  const snapshot = await buildBrokerPerformanceEngineSnapshot(brokerId, { emitMonitoring: false });
  const incentives = await buildBrokerIncentiveSummary(brokerId, {
    nowMs,
    emitMonitoring: false,
  });

  const leads = await prisma.lead.findMany({
    where: {
      OR: [{ introducedByBrokerId: brokerId }, { lastFollowUpByBrokerId: brokerId }],
    },
    select: {
      aiExplanation: true,
      pipelineStage: true,
      pipelineStatus: true,
      wonAt: true,
      lostAt: true,
      contactUnlockedAt: true,
      firstContactAt: true,
      lastContactedAt: true,
      lastContactAt: true,
      dmStatus: true,
      engagementScore: true,
      lastFollowUpAt: true,
      createdAt: true,
      meetingScheduledAt: true,
      meetingAt: true,
    },
    take: 500,
  }) as BrokerPerformanceLeadRow[];

  const rollup = computeTeamLeadRollup(leads, nowMs);
  const rawInput = computeBrokerPerformanceMetricsInputFromLeads(brokerId, leads, nowMs);
  const metrics = scoreBrokerPerformanceMetrics(rawInput);

  const stageCount = new Map<string, number>();
  for (const lead of leads) {
    const stage = deriveLeadClosingStageFromRow(lead);
    stageCount.set(stage, (stageCount.get(stage) ?? 0) + 1);
  }
  const pipelineStages: BrokerTeamPipelineStageCount[] = [...stageCount.entries()]
    .map(([stage, count]) => ({ stage, count }))
    .sort((a, b) => b.count - a.count);

  const aiAssistNote = brokerAiAssistFlags.brokerAiAssistV1
    ? "Broker AI Assist uses the same CRM telemetry as this view — suggestions and drafts stay manual; brokers choose when to send."
    : "When Broker AI Assist is enabled, it surfaces draft angles from CRM rules — execution stays with the broker.";

  const displayName = (user.name?.trim() || user.email?.trim() || "Broker").slice(0, 120);

  if (emitMon) {
    try {
      recordBrokerTeamBrokerDetailOpened(brokerId);
    } catch {
      /* ignore */
    }
  }

  return {
    brokerId,
    displayName,
    performance: snapshot,
    pipelineStages,
    followUpDiscipline: {
      followUpsDue: metrics.followUpsDue,
      followUpsOverdue: rollup.followUpsOverdue,
      followUpsCompleted: metrics.followUpsCompleted,
      leadsActive: rollup.leadsActive,
    },
    incentives,
    aiAssistNote,
    readOnly: true,
  };
}
