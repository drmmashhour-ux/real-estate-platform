/**
 * Deterministic next-step language — review tasks only (no automation triggers).
 */

import type { ExecCounts } from "@/modules/growth/weekly-review-analysis.service";

export function buildWeeklyRecommendations(params: {
  current: ExecCounts;
  prior: ExecCounts;
  topCity: string | null;
  weakestCity: string | null;
  sparseWeek: boolean;
}): { nextActions: string[]; priorityFocus: string[] } {
  const nextActions: string[] = [];
  const dLeads = params.current.leadsCaptured - params.prior.leadsCaptured;
  const dPb = params.current.playbooksCompleted - params.prior.playbooksCompleted;

  if (params.sparseWeek) {
    nextActions.push(
      "Do not expand geographic focus yet — stabilize logging completeness and widen the measurement window.",
    );
  }

  if (dLeads < 0 && params.topCity) {
    nextActions.push(`Review landing + capture attribution for ${params.topCity} — logged leads softened vs prior week.`);
  }

  if (dPb <= -1 && params.weakestCity) {
    nextActions.push(
      `Audit 48h playbook discipline for weaker markets such as ${params.weakestCity} — completions trailed prior week.`,
    );
  }

  if (nextActions.length === 0) {
    nextActions.push("Continue weekly monitoring — no large negative deltas surfaced in logged execution signals.");
  }

  const priorityFocus: string[] = [];
  if (params.weakestCity && params.weakestCity !== params.topCity) {
    priorityFocus.push(`${params.weakestCity}: tighten execution consistency before adding net-new markets.`);
  }
  if (params.topCity && dLeads >= 0) {
    priorityFocus.push(`${params.topCity}: maintain capture quality while documenting what operators changed (internal notes only).`);
  }
  if (priorityFocus.length === 0 && params.topCity) {
    priorityFocus.push(`${params.topCity}: keep instrumentation consistent so next week’s review stays comparable.`);
  }

  return {
    nextActions: nextActions.slice(0, 6),
    priorityFocus: priorityFocus.slice(0, 3),
  };
}
