/**
 * AI event logging. Console fallback when DB/audit not available.
 * Isolated so it can be swapped for real audit later.
 */

export type AiLogEvent =
  | "analysis_run"
  | "optimization_run"
  | "marketing_generation_run"
  | "lead_scored"
  | "template_recommended"
  | "chat_question_asked"
  | "contact_inquiry_submitted"
  | "immo_contact_submitted"
  | "client_chat_lead_created"
  | "client_chat_immo_lead_qualified"
  | "client_chat_lead_deduped"
  | "follow_up_sent"
  | "follow_up_job_scheduled"
  | "ai_writer_request"
  | "immo_chat_message"
  | "investment_insight"
  | "mortgage_insight"
  | "lecipm_manager_run"
  | "lecipm_manager_action";

export type AiLogPayload = Record<string, unknown>;

export function logAiEvent(event: AiLogEvent, payload?: AiLogPayload): void {
  try {
    const entry = {
      event,
      timestamp: new Date().toISOString(),
      ...payload,
    };
    if (typeof console !== "undefined" && console.info) {
      console.info("[AI]", event, entry);
    }
  } catch {
    // no-op
  }
}
