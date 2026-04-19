/**
 * Broker AI Assist — advisory suggestions and draft hints only. Never auto-executes CRM actions.
 */

export type BrokerAiAssistSuggestionType =
  | "next_step"
  | "message_hint"
  | "risk_alert"
  | "opportunity"
  | "objection_help"
  | "followup_timing";

export type BrokerAiAssistConfidence = "low" | "medium" | "high";

export type BrokerAiAssistUrgency = "low" | "medium" | "high";

export type BrokerAiAssistSuggestion = {
  id: string;
  leadId: string;
  type: BrokerAiAssistSuggestionType;
  title: string;
  description: string;
  confidenceLevel: BrokerAiAssistConfidence;
  urgency: BrokerAiAssistUrgency;
  rationale: string;
  suggestedAction: string;
  draftHint?: "first_contact" | "follow_up" | "meeting_push" | "revive_lead";
  safeOnly: true;
};

export type BrokerAiLeadSignalType =
  | "cooling_down"
  | "hot_lead"
  | "no_response_risk"
  | "ready_for_meeting"
  | "stalled_after_contact"
  | "strong_progress";

export type BrokerAiSignalSeverity = "info" | "low" | "medium" | "high";

export type BrokerAiLeadSignal = {
  leadId: string;
  signalType: BrokerAiLeadSignalType;
  label: string;
  description: string;
  severity: BrokerAiSignalSeverity;
};

export type BrokerAiAssistSummary = {
  leadId: string;
  topSignals: BrokerAiLeadSignal[];
  topSuggestions: BrokerAiAssistSuggestion[];
  primaryRecommendation: string;
};

export type BrokerAiDailyAssistLeadRef = {
  leadId: string;
  name: string;
};

export type BrokerAiDailyAssist = {
  followUpNow: BrokerAiDailyAssistLeadRef[];
  stallRisk: BrokerAiDailyAssistLeadRef[];
  opportunities: BrokerAiDailyAssistLeadRef[];
  lines: string[];
};
