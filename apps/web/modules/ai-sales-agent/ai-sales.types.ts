/** Modes — never impersonate a human broker; assistant acts on behalf of LECIPM only. */
export type AiSalesMode = "OFF" | "ASSIST" | "SAFE_AUTOPILOT" | "FULL_AUTOPILOT";

export type AiSalesTrigger =
  | "centris_capture"
  | "broker_manual_centris"
  | "user_requests_info"
  | "follow_up_timing"
  | "cron_tick";

export type AiSalesQualificationTier = "HOT" | "WARM" | "COLD";

export type AiSalesChannel = "email" | "sms" | "chat";

export type AiSalesQualificationAnswers = {
  intent?: "buy" | "rent" | "unknown";
  timeline?: string;
  budgetBand?: string;
  preferredArea?: string;
};

export type AiSalesQualificationResult = AiSalesQualificationAnswers & {
  tier: AiSalesQualificationTier;
  reasons: string[];
  /** Human-readable summary for brokers and logs */
  summary: string;
};

export type AiSalesSequenceStepKey =
  | "ai_sales_seq_d0_instant"
  | "ai_sales_seq_d1_followup"
  | "ai_sales_seq_d2_similar"
  | "ai_sales_seq_d3_urgency"
  | "ai_sales_seq_d5_final";

export type AiSalesEscalationReason =
  | "tier_hot"
  | "visit_requested"
  | "complex_question"
  | "broker_invite";

export type AiSalesTimelinePayload = {
  assistant: "lecipm";
  mode: AiSalesMode;
  trigger?: AiSalesTrigger;
  explain: string;
  channel?: AiSalesChannel;
  templateKey?: string;
  subject?: string;
  /** Redacted snippet for audit (no PII beyond what CRM already stores) */
  bodyPreview?: string;
  metadata?: Record<string, unknown>;
};
