/**
 * Positive recognition badges only — deterministic thresholds on real metrics.
 */

import type { BrokerBadge } from "./broker-incentives.types";
import type { BrokerPerformanceMetrics } from "@/modules/broker/performance/broker-performance.types";

export function computeBrokerBadges(metrics: BrokerPerformanceMetrics, nowIso: string): BrokerBadge[] {
  const badges: BrokerBadge[] = [];
  const n = metrics.leadsAssigned;
  const contacted = metrics.leadsContacted;
  const avgH = metrics.avgResponseDelayHours;

  /** Warm start — celebrates first steps when volume is naturally low */
  if (n >= 1 && n <= 6 && contacted >= 1) {
    badges.push({
      id: "warm_start",
      label: "Momentum starter",
      description: "You’re reaching assigned leads early — keep the cadence going as volume grows.",
      category: "activity",
      level: "bronze",
      unlockedAt: nowIso,
    });
  }

  const contactRate = n > 0 ? contacted / n : 0;
  if (n >= 8 && contactRate >= 0.55) {
    badges.push({
      id: "consistent_operator",
      label: "Consistent operator",
      description: "Healthy share of assigned leads show outbound progression.",
      category: "discipline",
      level: n >= 20 ? "gold" : n >= 12 ? "silver" : "bronze",
      unlockedAt: nowIso,
    });
  }

  if (avgH != null && avgH <= 12 && metrics.leadsResponded >= 3) {
    badges.push({
      id: "fast_responder",
      label: "Fast responder",
      description: "Unlock-to-first-contact timing is strong in your measurable sample.",
      category: "activity",
      level: avgH <= 6 ? "gold" : avgH <= 10 ? "silver" : "bronze",
      unlockedAt: nowIso,
    });
  }

  if (metrics.followUpsCompleted >= 5 && metrics.followUpsDue <= 3) {
    badges.push({
      id: "follow_up_pro",
      label: "Follow-up pro",
      description: "Follow-ups are logged and overdue debt stays controlled.",
      category: "followup",
      level: metrics.followUpsCompleted >= 15 ? "gold" : metrics.followUpsCompleted >= 8 ? "silver" : "bronze",
      unlockedAt: nowIso,
    });
  }

  if (metrics.meetingsMarked >= 3) {
    badges.push({
      id: "pipeline_mover",
      label: "Pipeline mover",
      description: "Several leads advance toward meetings — solid execution depth.",
      category: "conversion",
      level: metrics.meetingsMarked >= 12 ? "gold" : metrics.meetingsMarked >= 6 ? "silver" : "bronze",
      unlockedAt: nowIso,
    });
  }

  if (metrics.wonDeals >= 1) {
    badges.push({
      id: "closer",
      label: "Closer",
      description: "Recorded wins in CRM — outcomes depend on many factors; this reflects logged progress.",
      category: "conversion",
      level: metrics.wonDeals >= 10 ? "gold" : metrics.wonDeals >= 3 ? "silver" : "bronze",
      unlockedAt: nowIso,
    });
  }

  if (metrics.disciplineScore >= 72 && metrics.confidenceLevel !== "insufficient") {
    badges.push({
      id: "steady_rhythm",
      label: "Steady rhythm",
      description: "Follow-up discipline score is solid for your sample size.",
      category: "discipline",
      level: metrics.disciplineScore >= 85 ? "gold" : "silver",
      unlockedAt: nowIso,
    });
  }

  return badges;
}
