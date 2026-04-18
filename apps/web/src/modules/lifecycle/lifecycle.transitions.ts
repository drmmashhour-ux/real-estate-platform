import type { LifecycleStage } from "./lifecycle.states";

export type LifecycleSignals = {
  accountAgeDays: number;
  savedListingsCount: number;
  eventsLast30d: number;
  daysSinceLastActivity: number | null;
  growthMessagingPaused: boolean;
  hasActiveOfferOrDeal?: boolean;
};

/**
 * Transparent rules from observable metrics only — no ML.
 */
export function inferLifecycleStage(s: LifecycleSignals): LifecycleStage {
  if (s.growthMessagingPaused) return "dormant";
  if (s.hasActiveOfferOrDeal) return "converting";
  if (s.daysSinceLastActivity != null && s.daysSinceLastActivity > 60) return "churn_risk";
  if (s.daysSinceLastActivity != null && s.daysSinceLastActivity > 21) return "dormant";
  if (s.savedListingsCount >= 5 && s.eventsLast30d >= 8) return "high_intent";
  if (s.savedListingsCount >= 2 || s.eventsLast30d >= 4) return "active_searcher";
  if (s.accountAgeDays <= 7 && s.eventsLast30d <= 2) return "new_user";
  return "explorer";
}
