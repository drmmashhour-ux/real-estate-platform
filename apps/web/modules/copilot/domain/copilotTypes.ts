import type { CopilotUserIntent } from "@/modules/copilot/domain/copilotIntents";

/** Structured Copilot output — safe for API clients. */
export type CopilotActionItem = {
  id: string;
  label: string;
  /** Optional in-app link */
  href?: string;
  kind: "navigate" | "run_analysis" | "external_doc" | "info";
};

export type CopilotConfidence = "high" | "medium" | "low";

export type CopilotResponse = {
  intent: CopilotUserIntent;
  summary: string;
  actions: CopilotActionItem[];
  insights: string[];
  warnings: string[];
  confidence: CopilotConfidence;
  /** Deterministic payloads only — scores/strings from platform engines. */
  data: Record<string, unknown>;
};

export type CopilotError = {
  ok: false;
  error: string;
  code: "disabled" | "unauthorized" | "bad_request" | "forbidden" | "not_found";
};

export type CopilotResult =
  | { ok: true; response: CopilotResponse; conversationId?: string }
  | CopilotError;

/** Intent detection output */
export type IntentDetectionResult = {
  intent: CopilotUserIntent;
  confidence: CopilotConfidence;
  method: "keyword" | "llm";
};

/** Planned deterministic modules (for logging / tests) */
export type CopilotActionPlan = {
  intent: CopilotUserIntent;
  steps: readonly string[];
};

export type RankedDealItemDto = {
  listingId: string;
  title: string;
  city: string;
  priceCents: number;
  compositeScore: number;
  bucket: string;
  reasons: string[];
};

export type BrokerAttentionItemDto = {
  listingId: string;
  title: string;
  city: string;
  trustScore: number | null;
  moderationStatus: string;
  status: string;
  issues: string[];
};

export type SellerInsightDto = {
  listingId: string;
  title: string;
  priceCents: number;
  trustScore: number | null;
  imageCount: number;
  pricePosition: string | null;
  pricingConfidence: string | null;
  suggestedActions: string[];
  reasons: string[];
  dealRecommendation: string | null;
  dealConfidence: string | null;
};

export type PortfolioWeekItemDto = {
  eventType: string;
  severity: string;
  title: string;
  message: string;
  propertyId: string;
  createdAt: string;
};

export type CopilotBlock =
  | { type: "ranked_deals"; items: RankedDealItemDto[]; queryNote: string }
  | { type: "broker_attention"; items: BrokerAttentionItemDto[]; queryNote: string }
  | { type: "seller_insights"; insights: SellerInsightDto; queryNote: string }
  | { type: "portfolio_week"; events: PortfolioWeekItemDto[]; summaryNote: string | null; queryNote: string };
