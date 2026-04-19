/**
 * Deterministic coaching insights — advisory copy only.
 */

import type {
  BrokerPerformanceInsight,
  BrokerPerformanceMetrics,
} from "./broker-performance.types";

function insight(
  brokerId: string,
  partial: Omit<BrokerPerformanceInsight, "brokerId">,
): BrokerPerformanceInsight {
  return { brokerId, ...partial };
}

export function buildBrokerPerformanceInsights(metrics: BrokerPerformanceMetrics): BrokerPerformanceInsight[] {
  const id = metrics.brokerId;
  const out: BrokerPerformanceInsight[] = [];

  const n = metrics.leadsAssigned;
  const contacted = metrics.leadsContacted;
  const responded = metrics.leadsResponded;
  const meetings = metrics.meetingsMarked;

  if (metrics.confidenceLevel === "insufficient") {
    out.push(
      insight(id, {
        type: "data_quality",
        label: "Insufficient recent volume",
        description:
          "There are not enough assigned CRM leads in the sample to rank execution reliably — scores are intentionally conservative.",
        severity: "medium",
        suggestion: "As lead volume grows, these signals will stabilize; focus on consistent contact cadence.",
      }),
    );
  }

  const contactRate = n > 0 ? contacted / n : 0;
  const respProg = contacted > 0 ? responded / contacted : 0;
  const meetProg = responded > 0 ? meetings / responded : 0;

  if (metrics.disciplineScore >= 72 && metrics.followUpsCompleted >= 3) {
    out.push(
      insight(id, {
        type: "strength",
        label: "Strong follow-up discipline",
        description:
          "Follow-up touches are logged and overdue debt is controlled relative to the sample — good operational habit.",
        severity: "info",
        suggestion: "Keep logging touches so coaching signals stay accurate.",
      }),
    );
  }

  if (metrics.avgResponseDelayHours != null && metrics.avgResponseDelayHours > 24 && metrics.activityScore < 68) {
    out.push(
      insight(id, {
        type: "weakness",
        label: "Slow first response after unlock",
        description:
          "Measured unlock→first-contact delay is high versus faster peers in CRM telemetry — speed often correlates with engagement.",
        severity: "medium",
        suggestion: "Prioritize same-day acknowledgment when capacity allows.",
      }),
    );
  }

  if (contactRate < 0.55 && n >= 5) {
    out.push(
      insight(id, {
        type: "weakness",
        label: "Contact coverage gap",
        description: "A smaller share of assigned leads shows outbound progression than typical healthy cohorts in-sample.",
        severity: "medium",
        suggestion: "Batch new leads daily and clear the oldest untouched rows first.",
      }),
    );
  }

  if (responded > 0 && meetProg >= 0.45) {
    out.push(
      insight(id, {
        type: "strength",
        label: "Solid meeting progression",
        description: "Responded leads frequently advance toward meetings — strong conversion hygiene.",
        severity: "info",
      }),
    );
  }

  if (metrics.followUpsDue >= 3) {
    out.push(
      insight(id, {
        type: "weakness",
        label: "Several leads stuck after contact",
        description:
          "Multiple contacts remain overdue for follow-up (>48h without progression) — pipeline drag risk.",
        severity: "high",
        suggestion: "Clear overdue rows or explicitly park/archive per policy.",
      }),
    );
  }

  if (metrics.conversionScore >= 72 && metrics.confidenceLevel !== "insufficient") {
    out.push(
      insight(id, {
        type: "strength",
        label: "Healthy conversion mechanics",
        description: "Stage progression and/or close signals look solid for the current sample size.",
        severity: "info",
      }),
    );
  }

  if (metrics.wonDeals + metrics.lostDeals >= 5 && metrics.wonDeals >= metrics.lostDeals * 1.5) {
    out.push(
      insight(id, {
        type: "incentive_hint",
        label: "Steady close outcomes",
        description: "Win/loss counts suggest repeatable closing behavior in this window — incentive-ready signal.",
        severity: "low",
      }),
    );
  }

  return out.slice(0, 8);
}
