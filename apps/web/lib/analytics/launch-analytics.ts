import { trackFunnelEvent } from "@/lib/funnel/tracker";

export function trackLaunchStatusRead(meta: Record<string, unknown>) {
  void trackFunnelEvent("launch_status_read", meta);
}

export function trackAcquisitionLeadCreated(meta: Record<string, unknown>) {
  void trackFunnelEvent("acquisition_outreach_lead_created", meta);
}

export function trackOutreachScriptGenerated(meta: Record<string, unknown>) {
  void trackFunnelEvent("outreach_script_generated", meta);
}

export function trackInvestorPitchExported(meta: Record<string, unknown>) {
  void trackFunnelEvent("investor_pitch_exported", meta);
}

export function trackInvestorPitchViewed(meta: Record<string, unknown>) {
  void trackFunnelEvent("investor_pitch_viewed", meta);
}
