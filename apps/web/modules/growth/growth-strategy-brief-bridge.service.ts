/**
 * Short advisory lines for Daily Brief / Executive surfaces — decoupled strings only.
 */

import type { GrowthStrategyBundle } from "./growth-strategy.types";

export function buildStrategyBriefNotes(bundle: GrowthStrategyBundle): string[] {
  const notes: string[] = [];
  const plan = bundle.weeklyPlan;

  if (plan.topPriority) {
    notes.push(`This week, anchor on: ${plan.topPriority}`);
  }

  if (plan.status === "weak" || plan.status === "watch") {
    notes.push("Do not scale campaigns until conversion and governance signals improve.");
  }

  if (plan.experiments.length > 0) {
    notes.push("Run one bounded experiment (e.g. CTA or copy) before expanding traffic.");
  }

  if (plan.priorities.some((p) => p.theme === "lead_followup")) {
    notes.push("Prioritize high-intent lead follow-up in stand-up sequencing.");
  }

  if (plan.blockers.length > 0) {
    notes.push(`Watch blockers: ${plan.blockers.slice(0, 2).join("; ")}`);
  }

  return notes.slice(0, 6);
}
