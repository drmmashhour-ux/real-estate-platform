import type { SoinsFamilyAddonKey, SoinsMonitoringAddonKey } from "./soins-revenue.types";

/** Default monthly list prices (platform currency — document local FX separately). */
export const FAMILY_ADDON_LIST_PRICES: Record<SoinsFamilyAddonKey, number> = {
  CAMERA_ACCESS: 29,
  ADVANCED_ALERTS: 19,
  FAMILY_PREMIUM_DASHBOARD: 24,
  MULTI_FAMILY_MEMBER_SLOT: 12,
  ARCHIVED_CHAT_HISTORY: 9,
};

export const MONITORING_ADDON_LIST_PRICES: Record<SoinsMonitoringAddonKey, number> = {
  STANDARD_OPS_MONITORING: 49,
  PREMIUM_AI_SUMMARY: 79,
  ESCALATION_PLAYBOOK: 39,
};
