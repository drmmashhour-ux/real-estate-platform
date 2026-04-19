/**
 * Meeting-ready weekly team operating review — aggregates internal growth layers only.
 */

import { engineFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { buildExecutionPlan } from "@/modules/growth/execution-planner.service";
import {
  buildExecutionAccountabilitySummary,
  listChecklistCompletions,
} from "@/modules/growth/execution-accountability.service";
import { buildGrowthExecutionResultsSummary } from "@/modules/growth/growth-execution-results.service";
import { buildWeeklyReviewSummary } from "@/modules/growth/weekly-review.service";
import { getCoordinationSummary, listTaskAssignments } from "@/modules/growth/team-coordination.service";
import { analyzeWeeklyTeamSignals } from "@/modules/growth/weekly-team-review-analysis.service";
import { buildWeeklyTeamReviewInsights } from "@/modules/growth/weekly-team-review-insights.service";
import {
  logWeeklyTeamReviewBuilt,
  logWeeklyTeamReviewSummaryError,
} from "@/modules/growth/weekly-team-review-monitoring.service";
import type {
  RolePerformanceRow,
  WeeklyTeamDealInsights,
  WeeklyTeamReview,
  WeeklyTeamReviewConfidence,
  WorkloadDistributionRow,
} from "@/modules/growth/weekly-team-review.types";

async function leadPipelineStats(start: Date, end: Date) {
  const rows = await prisma.lead.findMany({
    where: { createdAt: { gte: start, lt: end } },
    select: { pipelineStage: true },
  });
  const leadsCaptured = rows.length;
  const leadsQualified = rows.filter((r) =>
    ["qualified", "meeting", "negotiation", "won"].includes(r.pipelineStage),
  ).length;
  const meetingsBooked = rows.filter((r) => ["meeting", "negotiation", "won"].includes(r.pipelineStage)).length;
  const dealsProgressed = rows.filter((r) => ["negotiation", "won"].includes(r.pipelineStage)).length;
  const dealsClosed = rows.filter((r) => r.pipelineStage === "won").length;
  return { leadsCaptured, leadsQualified, meetingsBooked, dealsProgressed, dealsClosed, rows };
}

function stageHistogram(stages: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of stages) m.set(s, (m.get(s) ?? 0) + 1);
  return m;
}

export type WeeklyTeamReviewPayload = {
  review: WeeklyTeamReview;
  insights: string[];
};

export async function buildWeeklyTeamReviewPayload(windowDays = 7): Promise<WeeklyTeamReviewPayload | null> {
  if (!engineFlags.weeklyTeamReviewV1) return null;

  const until = new Date();
  const periodEnd = until.toISOString();
  const currentStart = new Date(until.getTime() - windowDays * 86400000);
  const periodStart = currentStart.toISOString();
  const priorStart = new Date(until.getTime() - 2 * windowDays * 86400000);

  try {
    const [pipelineCur, pipelinePrior, acc, cord, assign, gexec, wk, plan] = await Promise.all([
      leadPipelineStats(currentStart, until),
      leadPipelineStats(priorStart, currentStart),
      Promise.resolve(buildExecutionAccountabilitySummary()),
      Promise.resolve(getCoordinationSummary()),
      Promise.resolve(listTaskAssignments()),
      engineFlags.growthExecutionResultsV1
        ? buildGrowthExecutionResultsSummary(windowDays).catch(() => null)
        : Promise.resolve(null),
      engineFlags.weeklyReviewV1 ? buildWeeklyReviewSummary(windowDays).catch(() => null) : Promise.resolve(null),
      engineFlags.executionPlannerV1 ? buildExecutionPlan(windowDays).catch(() => null) : Promise.resolve(null),
    ]);

    const tasksCompleted = cord.doneCount;
    const tasksInProgress = cord.inProgressCount;
    const tasksBlocked = cord.blockedCount + (plan?.blockedTasks.length ?? 0);

    const pitchCopies = listChecklistCompletions({ surfaceType: "pitch_script" }).length;
    const scriptUsageHighlights = [
      pitchCopies > 0 ? `${pitchCopies} pitch script copy events (shared accountability)` : null,
      pitchCopies === 0 ? "No pitch script copy traffic in accountability store" : null,
    ].filter((x): x is string => !!x);

    const hist = stageHistogram(pipelineCur.rows.map((r) => r.pipelineStage));
    let dropOffStage: string | null = null;
    let maxGap = -1;
    const order = ["new", "contacted", "qualified", "meeting", "negotiation", "won"];
    for (let i = 0; i < order.length - 1; i++) {
      const a = hist.get(order[i]) ?? 0;
      const b = hist.get(order[i + 1]) ?? 0;
      const gap = a - b;
      if (gap > maxGap && a >= 3) {
        maxGap = gap;
        dropOffStage = `${order[i]}→${order[i + 1]}`;
      }
    }

    let strongestStage: string | null = null;
    let bestRatio = -1;
    for (let i = 0; i < order.length - 1; i++) {
      const upper = hist.get(order[i + 1]) ?? 0;
      const lower = hist.get(order[i]) ?? 0;
      if (lower === 0) continue;
      const ratio = upper / lower;
      if (ratio > bestRatio && upper >= 2) {
        bestRatio = ratio;
        strongestStage = `${order[i]}→${order[i + 1]}`;
      }
    }

    const dealInsights: WeeklyTeamDealInsights = {
      dropOffStage,
      strongestStage,
      scriptUsageHighlights,
    };

    const leadDelta = pipelineCur.leadsCaptured - pipelinePrior.leadsCaptured;
    const qualifiedRate =
      pipelineCur.leadsCaptured > 0 ? pipelineCur.leadsQualified / pipelineCur.leadsCaptured : 0;

    const scalePositive =
      !!gexec?.scaleResults?.some((s) => s.targetType === "leads" && s.outcomeBand === "positive");

    const analysis = analyzeWeeklyTeamSignals({
      lowData: acc.lowData || pipelineCur.leadsCaptured + pipelinePrior.leadsCaptured < 12,
      executionCompletionRate: acc.completionRate,
      tasksBlocked,
      tasksInProgress,
      leadDelta,
      qualifiedRate,
      wonThisWindow: pipelineCur.dealsClosed,
      cityBundlePresent: !!(wk?.performance.topCity || wk?.performance.weakestCity),
      scalePositive,
    });

    const rolePerformance: RolePerformanceRow[] = cord.byRole.map((r) => ({
      role: r.role,
      done: r.done,
      inProgress: r.inProgress,
      blocked: r.blocked,
      label: `${r.role.replace(/_/g, " ")}`,
    }));

    const workloadDistribution: WorkloadDistributionRow[] = [
      {
        label: "Assignments (coordination)",
        value: assign.length,
        note: "In-memory map — resets on deploy.",
      },
      {
        label: "Planner blocked tasks",
        value: plan?.blockedTasks.length ?? 0,
        note: "Governance / data gates from execution planner.",
      },
    ];

    let confidence: WeeklyTeamReviewConfidence = "low";
    const eventScore =
      pipelineCur.leadsCaptured +
      pipelinePrior.leadsCaptured +
      assign.length +
      (plan?.todayTasks.length ?? 0);
    if (eventScore >= 48) confidence = "high";
    else if (eventScore >= 22) confidence = "medium";

    const warnings: string[] = [
      ...acc.lowData ? ["Execution accountability bundle is sparse — completion rates are directional only."] : [],
      "Correlational snapshot only — does not prove causation between Growth panels and revenue.",
      "No Stripe, pricing, or booking mutations originate from this summary.",
    ];
    if (!wk) warnings.push("Classic weekly operator review unavailable — enable FEATURE_WEEKLY_REVIEW_V1 for merged Fast Deal deltas.");
    if (!gexec) warnings.push("Deal performance snapshot omitted — enable execution results layer.");

    const review: WeeklyTeamReview = {
      periodStart,
      periodEnd,
      execution: {
        tasksCompleted,
        tasksInProgress,
        tasksBlocked,
        completionRate: acc.completionRate,
      },
      pipeline: {
        leadsCaptured: pipelineCur.leadsCaptured,
        leadsQualified: pipelineCur.leadsQualified,
        meetingsBooked: pipelineCur.meetingsBooked,
        dealsProgressed: pipelineCur.dealsProgressed,
        dealsClosed: pipelineCur.dealsClosed,
      },
      performance: {
        topCity: wk?.performance.topCity ?? null,
        weakestCity: wk?.performance.weakestCity ?? null,
        biggestImprovement:
          gexec?.scaleResults?.find((s) => s.delta > 0)?.targetType != null
            ? `Scale metric positive on ${gexec.scaleResults.find((s) => s.delta > 0)?.targetType ?? "target"}`
            : wk?.outcomes.positiveSignals[0] ?? null,
        biggestDrop:
          wk?.outcomes.negativeSignals[0] ??
          (analysis.negative[0] ?? null),
      },
      dealInsights,
      team: { rolePerformance, workloadDistribution },
      recommendations: {
        priorities: [
          ...(wk?.recommendations.priorityFocus.slice(0, 4) ?? []),
          ...(acc.completionRate < 0.35 ? ["Restore execution checklist cadence before scaling traffic."] : []),
        ].slice(0, 8),
        corrections: [
          ...(wk?.recommendations.nextActions.filter((_, i) => i < 3) ?? []),
          ...(tasksBlocked > 4 ? ["Unblock coordination tasks before adding net-new initiatives."] : []),
        ].slice(0, 8),
        focusAreas: [
          ...(wk?.performance.majorChanges.slice(0, 2) ?? []),
          `Lead Δ vs prior window: ${leadDelta >= 0 ? "+" : ""}${leadDelta}`,
        ].slice(0, 8),
      },
      analysis: {
        positive: analysis.positive,
        negative: analysis.negative,
        neutral: analysis.neutral,
        insufficient: analysis.insufficient,
      },
      meta: {
        confidence,
        warnings,
      },
    };

    const insights = buildWeeklyTeamReviewInsights(review);

    void logWeeklyTeamReviewBuilt({
      windowDays,
      confidence,
      lowData: acc.lowData || analysis.insufficient.length > 0,
    });

    return { review, insights };
  } catch (e) {
    logWeeklyTeamReviewSummaryError(e);
    return null;
  }
}
