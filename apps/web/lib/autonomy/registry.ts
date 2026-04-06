import type { ActionRisk } from "./types";

/**
 * Default risk when caller does not set `action.risk` explicitly.
 */
const DEFAULT_RISKS: Record<string, ActionRisk> = {
  content_update: "low",
  listing_content_update: "low",
  reorder_images: "low",
  seo_metadata_update: "low",
  internal_quality_flag: "low",
  safe_notification_template: "low",
  pricing_change: "medium",
  pricing_apply: "medium",
  publish_listing: "medium",
  promotion_approve: "medium",
  accept_ai_recommendation: "medium",
  ranking_adjustment: "low",
  growth_alert: "low",
  payment: "high",
  refund: "high",
  dispute_resolve: "high",
};

export function defaultRiskForActionType(type: string): ActionRisk {
  const key = type.trim().toLowerCase();
  return DEFAULT_RISKS[key] ?? "medium";
}

export function withDefaultRisk<T extends { type: string; risk?: ActionRisk }>(action: T): T & { risk: ActionRisk } {
  return {
    ...action,
    risk: action.risk ?? defaultRiskForActionType(action.type),
  };
}
