/**
 * Deterministic recommendations from performance summary — no guarantees.
 */

import type { BrokerPerformanceRecommendation, BrokerPerformanceSummary } from "./broker-performance.types";

export function buildBrokerPerformanceRecommendations(summary: BrokerPerformanceSummary): BrokerPerformanceRecommendation[] {
  const out: BrokerPerformanceRecommendation[] = [];
  const b = summary.breakdown;

  if (b.responseSpeedScore < 55) {
    out.push({
      id: "faster_after_unlock",
      title: "Contact leads faster after unlock",
      description:
        "Shorter time from contact unlock to first outreach is associated with better engagement in CRM data — prioritize same-day touches when possible.",
      impact: "high",
      why: "Response speed sub-score is below the neutral band.",
    });
  }

  if (b.contactRateScore < 55) {
    out.push({
      id: "contact_coverage",
      title: "Increase outbound contact coverage",
      description:
        "Work through new leads systematically so fewer sit untouched — adjust cadence before adding volume.",
      impact: "high",
      why: "Contact rate sub-score is low relative to peers in-sample.",
    });
  }

  if (b.engagementScore < 55) {
    out.push({
      id: "engagement_depth",
      title: "Deepen two-way engagement",
      description:
        "Aim for clear client replies or meeting steps — keep follow-ups concise and specific.",
      impact: "medium",
      why: "Engagement signals are muted in the current sample.",
    });
  }

  if (b.closeSignalScore < 55) {
    out.push({
      id: "pipeline_progression",
      title: "Move responded leads toward meetings",
      description:
        "When clients reply, propose concrete next steps (call slots, short agenda) to advance the pipeline.",
      impact: "medium",
      why: "Close-signal depth is limited or win/loss data is sparse.",
    });
  }

  if (b.retentionScore < 55) {
    out.push({
      id: "consistent_unlocks",
      title: "Keep lead access consistent",
      description:
        "Steady use of paid lead unlocks (when your workflow uses them) helps retention metrics — align purchases with follow-up capacity.",
      impact: "low",
      why: "Retention / repeat monetization signals are weak or missing.",
    });
  }

  if (summary.weakSignals.some((s) => /sample|not measurable|neutral/i.test(s))) {
    out.push({
      id: "more_volume",
      title: "Grow activity to stabilize the score",
      description:
        "Scores are noisy with few assigned leads — as volume grows, this profile will become more reliable.",
      impact: "medium",
      why: "Small sample — advisory only.",
    });
  }

  return out.slice(0, 6);
}
