import { trackEvent } from "@/src/services/analytics";

/**
 * CRM / product analytics (see `docs/audits/ai-broker-crm.md`).
 * Events include: `broker_crm_lead_created`, `broker_crm_status_changed`,
 * `broker_crm_lead_marked_contacted`, `broker_crm_lead_qualified`, `broker_crm_lead_closed`,
 * `broker_crm_ai_summary_generated`, `broker_crm_ai_reply_generated`, `broker_crm_next_action_generated`,
 * `broker_crm_priority_scored`, `broker_crm_note_added`, `broker_crm_message_sent`, `broker_crm_ai_reply_sent`, …
 */
export function trackBrokerCrm(
  eventType: string,
  metadata: Record<string, unknown> = {},
  opts?: { userId?: string | null }
): void {
  void trackEvent(eventType, metadata, opts).catch(() => {});
}
