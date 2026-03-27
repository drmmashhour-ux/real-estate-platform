export const DealAlertType = {
  SCORE_IMPROVED: "score_improved",
  SCORE_DROPPED: "score_dropped",
  TRUST_CHANGED: "trust_changed",
  PRICING_POSITION_CHANGED: "pricing_position_changed",
  OPPORTUNITY_UPGRADED: "opportunity_upgraded",
  RISK_INCREASED: "risk_increased",
  BNHUB_CANDIDATE_CHANGED: "bnhub_candidate_changed",
} as const;

export const AlertSeverity = {
  INFO: "info",
  WARNING: "warning",
} as const;

export const AlertStatus = {
  UNREAD: "unread",
  READ: "read",
  DISMISSED: "dismissed",
} as const;
