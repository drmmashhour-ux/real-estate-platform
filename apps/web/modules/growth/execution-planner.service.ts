/**
 * Merges growth intelligence into approval-only tasks — no execution, sends, or payment changes.
 */

import { engineFlags, growthMissionControlFlags, marketplaceFlywheelFlags } from "@/config/feature-flags";
import { buildCapitalAllocationPlan } from "@/modules/growth/capital-allocation.service";
import { buildWeeklyReviewSummary } from "@/modules/growth/weekly-review.service";
import { buildAiExecutionResults } from "@/modules/growth/ai-execution-results.service";
import { build30DayDominationPlan } from "@/modules/growth/city-domination.service";
import {
  aiConfidenceToPlanner,
  computeTaskPriorityWithRationale,
  effortFromPriority,
} from "@/modules/growth/execution-planner-priority.service";
import { applyBlockingWithReasons } from "@/modules/growth/execution-planner-blocking.service";
import { recordExecutionPlanGenerated } from "@/modules/growth/execution-planner-monitoring.service";
import type { CapitalAllocationBucketId } from "@/modules/growth/capital-allocation.types";
import type { AiAssistSuggestion } from "@/modules/growth/ai-assisted-execution.types";
import type {
  ExecutionPlan,
  ExecutionTask,
  ExecutionTaskActionType,
  ExecutionTaskCategory,
  ExecutionTaskTargetKind,
  PlannerConfidence,
} from "@/modules/growth/execution-planner.types";
import type { WeeklyReviewConfidence } from "@/modules/growth/weekly-review.types";
import { buildGrowthMissionControlSummary } from "@/modules/growth/growth-mission-control.service";
import { buildMissionControlActionBundle } from "@/modules/growth/growth-mission-control-action.service";
import type {
  MissionControlActionItem,
  MissionControlActionKind,
} from "@/modules/growth/growth-mission-control-action.types";
import { analyzeMarketplaceGrowth, prioritizeFlywheelInsights } from "@/modules/marketplace/flywheel.service";
import { summarizeFlywheelLearning } from "@/modules/growth/flywheel-learning.service";
import { buildGrowthActionSuccessProfiles } from "@/modules/growth/flywheel-success-profile.service";
import { buildAutoSuggestedGrowthActions } from "@/modules/growth/flywheel-auto-suggest.service";

function slug(...parts: string[]): string {
  const raw = parts.join("|").toLowerCase().replace(/[^a-z0-9|]+/g, "-").slice(0, 72);
  return raw.length ? raw : "task";
}

function bucketToCategory(id: CapitalAllocationBucketId): ExecutionTaskCategory {
  switch (id) {
    case "broker_acquisition":
      return "broker";
    case "conversion_optimization":
      return "conversion";
    case "city_expansion":
      return "expansion";
    case "city_execution":
      return "scaling";
    default:
      return "scaling";
  }
}

function inferTargetKind(target: string): ExecutionTaskTargetKind {
  if (target.startsWith("system:")) return "system";
  if (target.startsWith("market:") || target.toLowerCase().includes("market")) return "market";
  return "city";
}

function mcKindToAction(kind: MissionControlActionKind): ExecutionTaskActionType {
  if (kind === "inspect_risk") return "inspect";
  if (kind === "review_item") return "review";
  if (kind === "open_draft") return "draft";
  return "navigate";
}

function flywheelCategory(actionType: string): ExecutionTaskCategory {
  switch (actionType) {
    case "broker_acquisition":
      return "broker";
    case "pricing_adjustment":
      return "revenue";
    case "demand_generation":
      return "scaling";
    case "supply_growth":
      return "sourcing";
    case "conversion_fix":
      return "conversion";
    default:
      return "ops";
  }
}

function weeklyConfToPlanner(c: WeeklyReviewConfidence): PlannerConfidence {
  return c;
}

/** Exported for tests — stable ordering: priority desc, confidence desc, title asc. */
export function compareTasks(a: ExecutionTask, b: ExecutionTask): number {
  const pr = { high: 3, medium: 2, low: 1 };
  const d = pr[b.priority] - pr[a.priority];
  if (d !== 0) return d;
  const cr = { high: 3, medium: 2, low: 1 };
  const d2 = cr[b.confidence] - cr[a.confidence];
  if (d2 !== 0) return d2;
  return a.title.localeCompare(b.title);
}

/** Exported for deterministic planning tests — merges duplicate stable keys and keeps highest priority row. */
export function dedupeTasks(tasks: ExecutionTask[]): ExecutionTask[] {
  const m = new Map<string, ExecutionTask>();
  const rank = { high: 3, medium: 2, low: 1 };
  for (const t of tasks) {
    const key = `${t.source}:${t.category}:${slug(t.title)}`;
    const ex = m.get(key);
    if (!ex || rank[t.priority] > rank[ex.priority]) {
      m.set(key, t);
    } else if (rank[t.priority] === rank[ex.priority]) {
      m.set(key, {
        ...ex,
        description: `${ex.description.slice(0, 220)} · ${t.description.slice(0, 220)}`,
        warnings: [...new Set([...ex.warnings, ...t.warnings])],
        rationale: `${ex.rationale} ${t.rationale}`,
      });
    }
  }
  return [...m.values()].sort(compareTasks);
}

function aiToCategory(s: AiAssistSuggestion): ExecutionTaskCategory {
  if (s.type === "lead_followup" || s.type === "pricing_adjustment") return "conversion";
  if (s.type === "broker_message") return "broker";
  return "scaling";
}

function buildInsights(params: {
  allocationOn: boolean;
  weeklyOn: boolean;
  aiOn: boolean;
  dominationOn: boolean;
  governanceBlocked: boolean;
  missionOn: boolean;
  flywheelOn: boolean;
}): string[] {
  const layers = [
    params.allocationOn ? "capital allocation" : null,
    params.weeklyOn ? "weekly review" : null,
    params.aiOn ? "AI assist (deterministic)" : null,
    params.dominationOn ? "city domination checklist" : null,
    params.missionOn ? "mission control bridge" : null,
    params.flywheelOn ? "marketplace flywheel auto-suggest" : null,
  ].filter(Boolean);
  const out: string[] = [];
  out.push(
    layers.length
      ? `Inputs combined: ${layers.join(", ")}. Ordering is advisory — approvals gate coordination.`
      : "Limited upstream modules enabled — tasks may be sparse until related growth flags are on.",
  );
  if (params.governanceBlocked) {
    out.push("Governance freeze/block detected — resolve policy gates before scaling operational assignments.");
  }
  out.push("This layer plans and coordinates only — no messages, bookings, or Stripe changes originate here.");
  return out.slice(0, 8);
}

function taskShell(partial: Omit<ExecutionTask, "requiresApproval">): ExecutionTask {
  return { ...partial, requiresApproval: true };
}

function missionItemToTask(item: MissionControlActionItem, opts: { top: boolean }): ExecutionTask {
  let priority: ExecutionTask["priority"] = "medium";
  let rationale = item.rationale.slice(0, 400);
  let confidence: PlannerConfidence = "medium";

  if (opts.top) {
    priority = "high";
    confidence = "high";
    rationale = `${item.rationale} (Mission Control top bridge — navigation only.)`;
  } else if (item.priority === "high") {
    priority = "high";
    confidence = "high";
  } else if (item.priority === "low") {
    priority = "low";
    confidence = "low";
  }

  return taskShell({
    id: `pln-mc-${slug(item.id)}`,
    title: item.title.slice(0, 140),
    description: item.description.slice(0, 400),
    category: "ops",
    target: item.navTarget,
    targetKind: "panel",
    priority,
    effort: effortFromPriority(priority),
    source: "mission_control",
    confidence,
    warnings: [item.operatorHint.slice(0, 240)],
    rationale,
    targetSurface: `mission_control:${item.navTarget}`,
    actionType: mcKindToAction(item.actionType),
  });
}

/** Hard caps — deterministic sizing for Today / This week lists. */
export const EXECUTION_PLAN_TODAY_MAX = 5;
export const EXECUTION_PLAN_WEEKLY_MAX = 9;

export async function buildExecutionPlan(windowDays = 14): Promise<ExecutionPlan> {
  const generatedAt = new Date().toISOString();
  const candidates: ExecutionTask[] = [];

  let allocationOn = false;
  let weeklyOn = false;
  let aiOn = false;
  let dominationOn = false;
  let missionOn = false;
  let flywheelOn = false;
  let weeklyConf: WeeklyReviewConfidence | undefined;
  let governanceBlocked = false;
  let aiSparse = false;
  const plannerWeeklyConf = (): PlannerConfidence | undefined =>
    weeklyConf ? weeklyConfToPlanner(weeklyConf) : undefined;

  if (engineFlags.weeklyReviewV1) {
    const weekly = await buildWeeklyReviewSummary(Math.min(windowDays, 14)).catch(() => null);
    if (weekly) {
      weeklyOn = true;
      weeklyConf = weekly.meta.confidence;
      const bundleConf = weeklyConf;

      let i = 0;
      for (const line of weekly.recommendations.priorityFocus.slice(0, 4)) {
        i += 1;
        const pr = computeTaskPriorityWithRationale({
          weeklyUrgent: true,
          weeklyBundleConfidence: bundleConf,
        });
        candidates.push(
          taskShell({
            id: `pln-weekly-focus-${i}-${slug(line)}`,
            title: line.slice(0, 140),
            description: "From weekly review priority focus — validate in CRM before sequencing assignments.",
            category: "scaling",
            target: weekly.performance.topCity ?? "system:bundle",
            targetKind: weekly.performance.topCity ? "city" : "system",
            priority: pr.priority,
            effort: effortFromPriority(pr.priority),
            source: "weekly_review",
            confidence: weeklyConfToPlanner(weekly.meta.confidence),
            warnings: [...weekly.meta.warnings].slice(0, 6),
            rationale: pr.rationale,
            targetSurface: "growth:weekly_review",
            actionType: "review",
          }),
        );
      }

      let j = 0;
      for (const line of weekly.recommendations.nextActions.slice(0, 4)) {
        j += 1;
        const pr = computeTaskPriorityWithRationale({
          weeklyBundleConfidence: bundleConf,
        });
        candidates.push(
          taskShell({
            id: `pln-weekly-next-${j}-${slug(line)}`,
            title: line.slice(0, 140),
            description: "Weekly review next action — manual sequencing only.",
            category: "conversion",
            target: weekly.performance.weakestCity ?? weekly.performance.topCity ?? "system:bundle",
            targetKind:
              weekly.performance.weakestCity || weekly.performance.topCity ? "city" : "system",
            priority: pr.priority,
            effort: effortFromPriority(pr.priority),
            source: "weekly_review",
            confidence: weeklyConfToPlanner(weekly.meta.confidence),
            warnings: [...weekly.meta.warnings].slice(0, 6),
            rationale: pr.rationale,
            targetSurface: "growth:weekly_review",
            actionType: "assign",
          }),
        );
      }

      if (weekly.outcomes.insufficientSignals.length > 0) {
        candidates.push(
          taskShell({
            id: "pln-weekly-thin-signals",
            title: "Review thin weekly signals bundle",
            description: weekly.outcomes.insufficientSignals.slice(0, 5).join(" · "),
            category: "ops",
            target: "system:telemetry",
            targetKind: "system",
            priority: "low",
            effort: "low",
            source: "weekly_review",
            confidence: weeklyConf === "high" ? "medium" : "low",
            warnings: ["Insufficient bundle rows — do not infer ROI from this alone."],
            rationale: "Validation-only row for thin weekly signals.",
            targetSurface: "growth:weekly_review",
            actionType: "inspect",
          }),
        );
      }
    }
  }

  if (engineFlags.capitalAllocationV1) {
    allocationOn = true;
    const plan = await buildCapitalAllocationPlan(windowDays);
    for (const rec of plan.recommendations.slice(0, 8)) {
      if (rec.target.startsWith("system:growth_signals") && rec.bucket.id === "hold") continue;
      const pr = computeTaskPriorityWithRationale({
        allocationScore: rec.priorityScore,
        allocationConfidence: rec.confidence,
        weeklyBundleConfidence: plannerWeeklyConf(),
      });
      const w = [
        ...rec.warnings,
        ...(rec.allocationShare != null
          ? [`Relative share≈${(rec.allocationShare * 100).toFixed(0)}% (rank only).`]
          : []),
      ];
      candidates.push(
        taskShell({
          id: `pln-allocation-${slug(rec.target, rec.bucket.id)}`,
          title: `${rec.bucket.label}: ${rec.target}`,
          description: rec.rationale,
          category: bucketToCategory(rec.bucket.id),
          target: rec.target,
          targetKind: rec.target.startsWith("system") ? "system" : inferTargetKind(rec.target),
          priority: pr.priority,
          effort: effortFromPriority(pr.priority),
          source: "allocation",
          confidence: rec.confidence,
          warnings: w.slice(0, 8),
          rationale: pr.rationale,
          targetSurface: "growth:capital_allocation",
          actionType: "review",
        }),
      );
    }
  }

  if (engineFlags.aiAssistExecutionV1 || engineFlags.growthExecutionResultsV1) {
    aiOn = engineFlags.aiAssistExecutionV1;
    const ai = await buildAiExecutionResults(windowDays);
    aiSparse = ai.sparseTelemetry;
    governanceBlocked = governanceBlocked || ai.governanceFreeze;

    if (engineFlags.aiAssistExecutionV1) {
      for (const s of ai.suggestions.slice(0, 6)) {
        const pc = aiConfidenceToPlanner(s.confidence);
        const pr = computeTaskPriorityWithRationale({
          aiConfidence01: s.confidence,
          weeklyBundleConfidence: plannerWeeklyConf(),
        });
        const ws: string[] = [];
        if (s.type === "pricing_adjustment") {
          ws.push("Pricing posture requires human validation — no Stripe or live quote changes from this panel.");
        }
        candidates.push(
          taskShell({
            id: `pln-ai-${slug(s.id)}`,
            title: s.title,
            description: s.suggestion,
            category: aiToCategory(s),
            target: "system:crm",
            targetKind: "system",
            priority: pr.priority,
            effort: effortFromPriority(pr.priority),
            source: "ai_assist",
            confidence: pc,
            warnings: [...ws, "Deterministic CRM rules — not an LLM."],
            rationale: pr.rationale,
            targetSurface: "panel:crm",
            actionType: s.type === "pricing_adjustment" ? "review" : "navigate",
          }),
        );
      }
    }
  }

  if (engineFlags.cityDominationV1) {
    dominationOn = true;
    const focusCity =
      candidates.find((c) => c.source === "allocation" && !c.target.startsWith("system"))?.target ??
      candidates.find((c) => c.target && !c.target.startsWith("system"))?.target ??
      "your market";
    const dom = build30DayDominationPlan(focusCity);

    const d1 = dom.days.find((d) => d.day === 1);
    if (d1) {
      let k = 0;
      for (const act of d1.actions.slice(0, 3)) {
        k += 1;
        const pr = computeTaskPriorityWithRationale({
          dominationPhase: 0,
          weeklyBundleConfidence: plannerWeeklyConf(),
        });
        candidates.push(
          taskShell({
            id: `pln-dom-d1-${k}-${slug(act)}`,
            title: `Domination week 1: ${act}`,
            description: `${d1.focus} — manual checklist only.`,
            category: "scaling",
            target: dom.city,
            targetKind: "city",
            priority: pr.priority,
            effort: effortFromPriority(pr.priority),
            source: "domination_plan",
            confidence: weeklyConf ? weeklyConfToPlanner(weeklyConf) : "medium",
            warnings: ["Adapt to local compliance; no automated outbound from planner."],
            rationale: pr.rationale,
            targetSurface: "growth:city_domination",
            actionType: "assign",
          }),
        );
      }
    }

    for (const dm of dom.days.filter((d) => d.day > 1)) {
      const pr = computeTaskPriorityWithRationale({
        dominationPhase: dm.day <= 8 ? 1 : dm.day <= 15 ? 2 : 3,
        weeklyBundleConfidence: plannerWeeklyConf(),
      });
      candidates.push(
        taskShell({
          id: `pln-dom-milestone-${dm.day}`,
          title: `${dm.focus} (${dom.city})`,
          description: dm.actions.join(" · "),
          category: "expansion",
          target: dom.city,
          targetKind: "city",
          priority: pr.priority,
          effort: effortFromPriority(pr.priority),
          source: "domination_plan",
          confidence: "medium",
          warnings: ["Future milestone — not auto-scheduled."],
          rationale: pr.rationale,
          targetSurface: "growth:city_domination",
          actionType: "compare",
        }),
      );
    }
  }

  if (growthMissionControlFlags.growthMissionControlV1) {
    const mc = await buildGrowthMissionControlSummary().catch(() => null);
    if (mc) {
      missionOn = true;
      const bundle = buildMissionControlActionBundle(mc);
      if (bundle.topAction) {
        candidates.push(missionItemToTask(bundle.topAction, { top: true }));
      }
      for (const item of bundle.actionItems.slice(0, 2)) {
        candidates.push(missionItemToTask(item, { top: false }));
      }
    }
  }

  if (marketplaceFlywheelFlags.marketplaceFlywheelAutoSuggestV1) {
    try {
      const [insights, learningRaw, profiles] = await Promise.all([
        analyzeMarketplaceGrowth(),
        summarizeFlywheelLearning().catch(() => null),
        buildGrowthActionSuccessProfiles(),
      ]);
      const learning = learningRaw ?? { byInsightType: {}, actionTypeEffectiveness: [] };
      const bundle = buildAutoSuggestedGrowthActions({
        prioritizedInsights: prioritizeFlywheelInsights(insights),
        learning,
        profiles,
      });
      flywheelOn = true;
      for (const s of bundle.suggestions.slice(0, 3)) {
        const pc: PlannerConfidence =
          s.confidenceLevel === "high" ? "high" : s.confidenceLevel === "medium" ? "medium" : "low";
        const basePr = computeTaskPriorityWithRationale({
          flywheelLowConfidence: s.confidenceLevel === "low",
        });
        let priority = basePr.priority;
        let rationale = basePr.rationale;
        if (s.recommendedNow && s.confidenceLevel !== "low") {
          priority = "high";
          rationale =
            "Flywheel ranking elevated this suggestion for triage — historical scores are associative, not causal guarantees.";
        } else if (s.confidenceLevel === "medium") {
          priority = priority === "low" ? "medium" : priority;
        }
        const cat = flywheelCategory(s.actionType);
        candidates.push(
          taskShell({
            id: `pln-fw-${slug(s.id)}`,
            title: s.title.slice(0, 140),
            description: s.rationale.slice(0, 500),
            category: cat,
            target: "market:flywheel",
            targetKind: "market",
            priority,
            effort: effortFromPriority(priority),
            source: "flywheel",
            confidence: pc,
            warnings: [...bundle.warnings].slice(0, 5),
            rationale,
            targetSurface: "growth:flywheel",
            actionType: "review",
          }),
        );
      }
    } catch {
      /* skip flywheel slice */
    }
  }

  const deduped = dedupeTasks(candidates);

  const blockingCtx = {
    governanceBlocked,
    weeklyConfidence: weeklyConf,
    aiSparseTelemetry: aiSparse,
  };

  const { allowed, blocked } = applyBlockingWithReasons(deduped, blockingCtx);

  const sortedAllowed = [...allowed].sort(compareTasks);
  const todayTasks = sortedAllowed.slice(0, EXECUTION_PLAN_TODAY_MAX);
  const weeklyTasks = sortedAllowed.slice(
    EXECUTION_PLAN_TODAY_MAX,
    EXECUTION_PLAN_TODAY_MAX + EXECUTION_PLAN_WEEKLY_MAX,
  );

  const insights = buildInsights({
    allocationOn,
    weeklyOn,
    aiOn,
    dominationOn,
    governanceBlocked,
    missionOn,
    flywheelOn,
  });

  void recordExecutionPlanGenerated({
    todayCount: todayTasks.length,
    weeklyCount: weeklyTasks.length,
    blockedCount: blocked.length,
  });

  return {
    todayTasks,
    weeklyTasks,
    blockedTasks: blocked,
    insights,
    generatedAt,
  };
}
