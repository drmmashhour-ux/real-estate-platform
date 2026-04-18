/**
 * Advisory insight lines from feedback summary — no policy mutation.
 */

import type { GrowthGovernanceFeedbackInsight, GrowthGovernanceFeedbackSummary } from "./growth-governance-feedback.types";

const MAX_INSIGHTS = 6;

export function buildGrowthGovernanceFeedbackInsights(summary: GrowthGovernanceFeedbackSummary): GrowthGovernanceFeedbackInsight[] {
  const out: GrowthGovernanceFeedbackInsight[] = [];

  if (summary.repeatedUsefulConstraints.length > 0) {
    const top = summary.repeatedUsefulConstraints[0];
    out.push({
      title: "Useful constraint signal",
      detail: `${top.title} (${top.target}) appears among repeated useful patterns.`,
      severity: "low",
      recommendation: "Keep documenting outcomes when this constraint activates — still no auto policy change.",
    });
  }

  if (summary.repeatedFreezePatterns.length >= 2) {
    out.push({
      title: "Repeated freeze patterns",
      detail: "Multiple freeze-class signals co-occur — review whether freezes cluster around the same domains.",
      severity: "medium",
      recommendation: "Schedule a governance review; do not auto-unfreeze.",
    });
  }

  if (summary.repeatedBlockedPatterns.length >= 2) {
    out.push({
      title: "Repeated block patterns",
      detail: "Several blocked paths surface together — confirm blocks match current risk appetite.",
      severity: "medium",
      recommendation: "Human review of policy domains listed under blocks.",
    });
  }

  if (summary.possibleOverconservativeConstraints.length > 0) {
    out.push({
      title: "Possible over-conservative gating",
      detail:
        "Some promotion or advisory gates may be tighter than current governance posture suggests — verify with evidence.",
      severity: "high",
      recommendation: "Review enforcement targets manually; this layer never relaxes rules automatically.",
    });
  }

  if (summary.notes.some((n) => n.includes("Partial inputs"))) {
    out.push({
      title: "Incomplete feedback inputs",
      detail: "Some sources were unavailable — treat recurrence and usefulness as lower confidence.",
      severity: "low",
      recommendation: "Re-run when governance, policy, and enforcement APIs are reachable.",
    });
  }

  if (out.length === 0) {
    out.push({
      title: "Quiet governance feedback window",
      detail: "No strong recurring patterns in this build — continue normal oversight.",
      severity: "low",
      recommendation: "No action required from this advisory layer.",
    });
  }

  return out.slice(0, MAX_INSIGHTS);
}
