/**
 * Combines performance metrics with recognition layers — highlights & next targets stay constructive.
 */

import { prisma } from "@/lib/db";
import { aggregateBrokerPerformanceMetrics } from "@/modules/broker/performance/broker-performance.service";
import { scoreBrokerPerformanceMetrics } from "@/modules/broker/performance/broker-performance-scoring.service";
import type { BrokerPerformanceMetrics } from "@/modules/broker/performance/broker-performance.types";
import { computeBrokerBadges } from "./broker-badge.service";
import { computeBrokerMilestones } from "./broker-milestone.service";
import { computeBrokerStreaks } from "./broker-streak.service";
import { recordIncentiveSummaryBuilt } from "./broker-incentives-monitoring.service";
import type { BrokerBadge, BrokerIncentiveSummary, BrokerStreak } from "./broker-incentives.types";

function buildHighlights(metrics: BrokerPerformanceMetrics, streaks: BrokerStreak[], badges: BrokerBadge[]): string[] {
  const out: string[] = [];

  const act = streaks.find((s) => s.type === "activity");
  if (act && act.currentCount >= 3) {
    out.push(`${act.currentCount}-day activity rhythm — nice consistency.`);
  }

  const fu = streaks.find((s) => s.type === "followup");
  if (fu && fu.currentCount >= 2) {
    out.push("Follow-up logging streak — your CRM trail stays fresh.");
  }

  if (metrics.activityScore >= 72) {
    out.push("Strong activity score for your current sample.");
  }
  if (metrics.conversionScore >= 72) {
    out.push("Conversion mechanics look healthy — keep advancing meetings.");
  }
  if (badges.length > 0) {
    out.push(`Recognition unlocked: ${badges[0].label}.`);
  }

  if (metrics.confidenceLevel === "insufficient") {
    out.push("Early sample — incentives will grow as more leads enter your workspace.");
  }

  return out.slice(0, 5);
}

function buildNextTargets(metrics: BrokerPerformanceMetrics): string[] {
  const out: string[] = [];
  const n = metrics.leadsAssigned;
  const gap = n - metrics.leadsContacted;

  if (n > 0 && gap > 0) {
    out.push(`Reach out on ${gap} assigned lead${gap === 1 ? "" : "s"} still awaiting first progression.`);
  }

  if (metrics.followUpsDue >= 1) {
    out.push(`Clear ${metrics.followUpsDue} overdue follow-up${metrics.followUpsDue === 1 ? "" : "s"} when you can.`);
  }

  if (metrics.meetingsMarked > 0 && metrics.leadsResponded > metrics.meetingsMarked) {
    out.push("Propose concrete next steps for engaged leads — move conversations toward a meeting.");
  }

  if (metrics.confidenceLevel === "insufficient") {
    out.push("Keep steady touches — milestones unlock naturally as volume grows.");
  }

  if (out.length === 0) {
    out.push("Maintain rhythm: short daily passes through new and waiting leads.");
  }

  return out.slice(0, 4);
}

export async function buildBrokerIncentiveSummary(
  brokerId: string,
  options?: { nowMs?: number; emitMonitoring?: boolean },
): Promise<BrokerIncentiveSummary | null> {
  const raw = await aggregateBrokerPerformanceMetrics(brokerId);
  if (!raw) return null;

  const metrics = scoreBrokerPerformanceMetrics(raw);
  const nowMs = options?.nowMs ?? Date.now();
  const nowIso = new Date(nowMs).toISOString();

  const leads = await prisma.lead.findMany({
    where: {
      OR: [{ introducedByBrokerId: brokerId }, { lastFollowUpByBrokerId: brokerId }],
    },
    select: {
      firstContactAt: true,
      lastContactAt: true,
      lastContactedAt: true,
      lastFollowUpAt: true,
      contactUnlockedAt: true,
    },
    take: 500,
  });

  const streaks = computeBrokerStreaks(leads, nowMs);
  const badges = computeBrokerBadges(metrics, nowIso);
  const milestones = await computeBrokerMilestones(brokerId, metrics);

  const highlights = buildHighlights(metrics, streaks, badges);
  const nextTargets = buildNextTargets(metrics);

  if (options?.emitMonitoring !== false) {
    recordIncentiveSummaryBuilt({
      badgeCount: badges.length,
      streakCount: streaks.length,
      milestoneAchieved: milestones.filter((m) => m.achieved).length,
    });
  }

  return {
    brokerId,
    badges,
    streaks,
    milestones,
    highlights,
    nextTargets,
  };
}
