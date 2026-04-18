/**
 * User lifecycle stages — drives safe orchestration hints only (no auto-sends).
 */
export type LifecycleStage =
  | "new_user"
  | "explorer"
  | "active_searcher"
  | "high_intent"
  | "converting"
  | "dormant"
  | "churn_risk";

export const LIFECYCLE_ORDER: LifecycleStage[] = [
  "new_user",
  "explorer",
  "active_searcher",
  "high_intent",
  "converting",
  "dormant",
  "churn_risk",
];
