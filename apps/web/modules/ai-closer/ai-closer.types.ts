/** Human-in-the-loop closing assist — never impersonates a licensed broker. */
export type AiCloserStage =
  | "AWARE"
  | "INTERESTED"
  | "QUALIFIED"
  | "HESITATING"
  | "READY_TO_BOOK"
  | "ESCALATE_TO_BROKER"
  | "WON"
  | "LOST";

export type AiCloserRouteContext =
  | "centris"
  | "direct"
  | "broker_crm"
  | "investor"
  | "bnhub"
  | "call_center"
  | "training"
  | "unknown";

export type AiCloserObjectionKey =
  | "just_browsing"
  | "not_ready"
  | "too_expensive"
  | "need_to_think"
  | "send_details_first"
  | "no_time"
  | "already_working_with_someone"
  | "human_requested"
  | "complex_transactional"
  | "none";

export type AiCloserEscalationTarget = "broker" | "sales_admin" | "investor_contact";

export type AiCloserPersonalityHint = "analytical" | "driver" | "expressive" | "amiable" | "unknown";

export type AiCloserStageContext = {
  /** Recent messages, newest last */
  messages?: string[];
  transcript?: string;
  /** Optional CRM hints */
  visitIntent?: boolean;
  bookingAttempts?: number;
  clickSignals?: number;
  timelineUrgency?: "low" | "medium" | "high";
  /** Last matched objection key */
  objectionKey?: AiCloserObjectionKey;
  optedOut?: boolean;
};

export type AiCloserResponsePack = {
  main: string;
  alternatives: [string, string];
  bestCta: string;
  confidence: number;
};

export type AiCloserExplanation = {
  detectedStage: AiCloserStage;
  stageReasons: string[];
  detectedObjection: AiCloserObjectionKey;
  objectionSignals: string[];
  whyThisLine: string;
  bookingRecommendation: "yes" | "no" | "soft";
  bookingReason: string;
  escalationRecommendation: "yes" | "no";
  escalationReason: string;
  confidenceBasis: string[];
  complianceNote: string;
};

export type AiCloserBookingSlotSuggestion = {
  message: string;
  lines: string[];
  brokerId: string | null;
  availabilityNote: string;
};

export type AiCloserAssistOutput = {
  assistantDisclosure: string;
  detectedStage: AiCloserStage;
  objection: AiCloserObjectionKey;
  response: AiCloserResponsePack;
  nextBestQuestion: string;
  /** 0–1 */
  confidence: number;
  shouldEscalate: boolean;
  shouldAttemptBooking: boolean;
  escalation?: {
    target: AiCloserEscalationTarget;
    reason: string;
    urgency: "low" | "medium" | "high";
  };
  bookingPrompt?: string;
  /**
   * Real availability from broker calendar + LECIPM booking engine (when `leadId` + `listingId` are provided).
   */
  bookingSlotSuggestion?: AiCloserBookingSlotSuggestion;
  /** LECIPM no-show engine — soft reconfirm nudge when a scheduled visit is high-risk. */
  noShowAssist?: { visitId: string | null; nudge: string; riskBand: "LOW" | "MEDIUM" | "HIGH" | "UNSET" };
  explanation: AiCloserExplanation;
  /** OACIQ legal boundary — negotiation AI disabled for FSBO / unbrokered files when listing context is present. */
  legalBoundary?: {
    mode: "BROKERED" | "FSBO";
    blockedCapability: string;
    brokerConversionPrompt: boolean;
  };
};
