/**
 * Next-week change suggestions — advisory, bounded, deterministic; no execution.
 */

import type {
  GrowthOperatingReviewBuildInput,
  GrowthOperatingReviewItem,
} from "./growth-operating-review.types";

const MAX = 5;

let seq = 0;
function mk(
  source: GrowthOperatingReviewItem["source"],
  title: string,
  detail: string,
  severity: GrowthOperatingReviewItem["severity"],
  createdAt: string,
): GrowthOperatingReviewItem {
  seq += 1;
  return {
    id: `gor-next-${seq}`,
    category: "change_next_week",
    title,
    detail,
    source,
    severity,
    createdAt,
  };
}

/**
 * Produces up to five concise, actionable suggestions from read-only signals.
 * Order is fixed so outputs are stable for the same inputs.
 */
export function buildNextWeekChangeItems(input: GrowthOperatingReviewBuildInput): GrowthOperatingReviewItem[] {
  seq = 0;
  const out: GrowthOperatingReviewItem[] = [];
  const { createdAt } = input;
  const g = input.governance;
  const ex = input.executive;

  if (g?.status === "human_review_required" || g?.status === "freeze_recommended") {
    out.push(
      mk(
        "governance",
        "Unblock governance review before expanding scope",
        "Resolve human review or freeze-recommended posture deliberately — advisory only; source governance remains authoritative.",
        "high",
        createdAt,
      ),
    );
  }

  if (ex?.campaignSummary.adsPerformance === "WEAK") {
    out.push(
      mk(
        "strategy",
        "Review underperforming acquisition / campaign narrative",
        "Executive snapshot shows WEAK paid funnel band — validate creative, targeting, and landing alignment manually.",
        "high",
        createdAt,
      ),
    );
  }

  if (input.followUp.highIntentQueued >= 8 || input.followUp.dueNow >= 6) {
    out.push(
      mk(
        "executive",
        "Prioritize follow-up before acquisition scale",
        "Follow-up queue shows pressure (due-now or high-score backlog) — reduce concurrent acquisition experiments until capacity clears.",
        "medium",
        createdAt,
      ),
    );
  }

  if (input.autopilot.rejected >= 3) {
    out.push(
      mk(
        "autopilot",
        "Reconcile rejected autopilot actions with policy",
        `${input.autopilot.rejected} rejected rows — align expectations with governance / enforcement before promoting new actions.`,
        "medium",
        createdAt,
      ),
    );
  }

  if (input.learningControlFreezeRecommended) {
    out.push(
      mk(
        "governance",
        "Review learning control before expecting adaptive shifts",
        "Learning adjustments are frozen — confirm signals and policy before relying on weight changes.",
        "medium",
        createdAt,
      ),
    );
  }

  if (input.strategyBundle?.weeklyPlan.status === "weak") {
    out.push(
      mk(
        "strategy",
        "Tighten weekly priorities (fewer concurrent themes)",
        "Strategy weekly plan is weak — narrow to top three actionable themes for the next cycle.",
        "medium",
        createdAt,
      ),
    );
  }

  if ((input.enforcementSnapshot?.blockedTargets.length ?? 0) >= 2) {
    out.push(
      mk(
        "governance",
        "Clear advisory-path enforcement blockers you intend to use",
        "Multiple enforcement targets are blocked — review policy modes if those paths should stay available in advisory scope.",
        "low",
        createdAt,
      ),
    );
  }

  const deferScen = input.simulationBundle?.scenarios.filter((s) => s.recommendation === "defer").length ?? 0;
  if (deferScen >= 2) {
    out.push(
      mk(
        "simulation",
        "Schedule human review for deferred simulation scenarios",
        "Multiple simulations recommend defer — treat estimates as non-binding and decide sequencing offline.",
        "low",
        createdAt,
      ),
    );
  }

  if ((input.memorySummary?.recurringBlockers.length ?? 0) >= 1) {
    out.push(
      mk(
        "memory",
        "Address recurring blockers called out in growth memory",
        "Memory layer lists recurring friction — validate whether still current and pick one owner-led fix.",
        "low",
        createdAt,
      ),
    );
  }

  if ((ex?.topRisks.length ?? 0) >= 3) {
    out.push(
      mk(
        "executive",
        "Reduce advisory noise — focus on top three risks",
        "Executive list carries several risks — consolidate to the three highest-leverage items for the week.",
        "low",
        createdAt,
      ),
    );
  }

  return out.slice(0, MAX);
}
