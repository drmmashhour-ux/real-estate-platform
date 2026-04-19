/**
 * Block or quarantine tasks — structured reasons + unblock hints; never throws.
 */

import type {
  BlockedExecutionTask,
  ExecutionTask,
} from "@/modules/growth/execution-planner.types";
import type { WeeklyReviewConfidence } from "@/modules/growth/weekly-review.types";

export type PlannerBlockingContext = {
  governanceBlocked: boolean;
  governanceMessage?: string;
  weeklyConfidence?: WeeklyReviewConfidence;
  aiSparseTelemetry?: boolean;
};

const UNBLOCK_GOV =
  "In Policy Enforcement / governance consoles, resolve freeze or block on safe execution targets, then refresh this plan.";
const UNBLOCK_WEEKLY =
  "Extend the weekly review window or enrich Fast Deal logging until bundle confidence rises above low.";
const UNBLOCK_AI_SPARSE =
  "Record more AI execution panel interactions (view/copy/ack) or widen the comparison window before acting on pricing posture.";
const UNBLOCK_LOW_CONF =
  "Gather more scored flywheel samples or operator evaluations before treating this flywheel row as actionable.";

const GOV_REASON =
  "Policy enforcement is in freeze/block for safe execution — operational follow-through is held until governance clears.";

export function shouldBlockTaskForGovernance(task: ExecutionTask, ctx: PlannerBlockingContext): boolean {
  if (!ctx.governanceBlocked) return false;
  if (task.source === "ai_assist" && task.id === "scale-v2-governance") return false;
  return true;
}

export function shouldBlockTaskForWeeklyBundle(
  task: ExecutionTask,
  ctx: PlannerBlockingContext,
): boolean {
  if (task.source !== "weekly_review") return false;
  if (ctx.weeklyConfidence !== "low") return false;
  if (task.priority === "low") return false;
  return true;
}

export function shouldBlockAiPriceWhenSparse(task: ExecutionTask, ctx: PlannerBlockingContext): boolean {
  if (!ctx.aiSparseTelemetry) return false;
  if (task.source !== "ai_assist") return false;
  if (!task.title.toLowerCase().includes("pric")) return false;
  return true;
}

export function shouldBlockLowConfidenceFlywheel(task: ExecutionTask): boolean {
  if (task.source !== "flywheel") return false;
  return task.confidence === "low" && task.priority !== "low";
}

export function blockReason(when: boolean, message: string): string | null {
  return when ? message : null;
}

function firstUnblock(messages: { when: boolean; reason: string; unblock: string }[]): {
  reason: string;
  unblock: string;
} | null {
  for (const m of messages) {
    if (m.when) return { reason: m.reason, unblock: m.unblock };
  }
  return null;
}

export function applyBlockingWithReasons(
  tasks: ExecutionTask[],
  ctx: PlannerBlockingContext,
): { allowed: ExecutionTask[]; blocked: BlockedExecutionTask[] } {
  const allowed: ExecutionTask[] = [];
  const blocked: BlockedExecutionTask[] = [];

  for (const t of tasks) {
    const checks = [
      {
        when: shouldBlockTaskForGovernance(t, ctx),
        reason: GOV_REASON,
        unblock: UNBLOCK_GOV,
      },
      {
        when: shouldBlockTaskForWeeklyBundle(t, ctx),
        reason: "Weekly bundle confidence is low — urgency claims need validation.",
        unblock: UNBLOCK_WEEKLY,
      },
      {
        when: shouldBlockAiPriceWhenSparse(t, ctx),
        reason: "Sparse AI telemetry — monetization posture text is exploratory.",
        unblock: UNBLOCK_AI_SPARSE,
      },
      {
        when: shouldBlockLowConfidenceFlywheel(t),
        reason: "Flywheel suggestion confidence is low — avoid treating as execution-ready.",
        unblock: UNBLOCK_LOW_CONF,
      },
    ];

    const hit = firstUnblock(checks);
    if (hit) {
      blocked.push({
        ...t,
        blockReason: hit.reason,
        unblockSuggestion: hit.unblock,
        warnings: t.warnings,
      });
    } else {
      allowed.push(t);
    }
  }

  return { allowed, blocked };
}
