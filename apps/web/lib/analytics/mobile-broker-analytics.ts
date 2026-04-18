import { trackFunnelEvent } from "@/lib/funnel/tracker";

export function trackMobileBrokerHomeViewed(meta: Record<string, unknown> = {}) {
  void trackFunnelEvent("mobile_broker_home_viewed", meta);
}

export function trackMobileActionCenterViewed(meta: Record<string, unknown> = {}) {
  void trackFunnelEvent("mobile_broker_action_center_viewed", meta);
}

export function trackMobileActionCompleted(meta: Record<string, unknown>) {
  void trackFunnelEvent("mobile_broker_action_completed", meta);
}

export function trackMobileApprovalCompleted(meta: Record<string, unknown>) {
  void trackFunnelEvent("mobile_broker_approval_completed", meta);
}

export function trackMobileFollowUpLogged(meta: Record<string, unknown>) {
  void trackFunnelEvent("mobile_broker_followup_logged", meta);
}

export function trackMobilePushPreferenceChanged(meta: Record<string, unknown>) {
  void trackFunnelEvent("mobile_broker_push_preference_changed", meta);
}
