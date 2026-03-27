import type { AiHub } from "../core/types";

/** High-level decision categories for audit and routing. */
export type AiDecisionType =
  | "BUYER_DECISION"
  | "SELLER_DECISION"
  | "BNHUB_BOOKING_DECISION"
  | "BROKER_LEAD_DECISION"
  | "MORTGAGE_DECISION"
  | "INVESTOR_DECISION"
  | "ADMIN_DECISION";

export type DecisionEntityType =
  | "listing"
  | "booking"
  | "lead"
  | "deal"
  | "invoice"
  | "platform"
  | "rental_listing"
  | "rental_application"
  | "rental_lease";

/** When entityType is listing, disambiguate Prisma model. */
export type ListingVariant = "fsbo" | "crm" | "short_term";

export type PriorityLevel = "low" | "medium" | "high" | "critical";

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export type DecisionRiskItem = {
  type: string;
  severity: RiskSeverity;
  explanation: string;
  suggestedAction: string;
};

export type DecisionRecommendation = {
  title: string;
  detail: string;
  impact: PriorityLevel;
};

export type DecisionEngineResult = {
  summary: string;
  risks: DecisionRiskItem[];
  recommendations: DecisionRecommendation[];
  priorityLevel: PriorityLevel;
  nextBestAction: string;
  confidenceScore: number;
  decisionType: AiDecisionType;
  reasoning: string;
};

export type EvaluateContextInput = {
  hub: AiHub;
  userRole: string;
  userId: string;
  entityType: DecisionEntityType;
  /** Required for non-platform entities */
  entityId: string | null;
  /** Required when entityType === "listing" */
  listingVariant?: ListingVariant;
  /** Skip DB logging (e.g. dry run) */
  skipLog?: boolean;
};

export function decisionTypeForHub(hub: AiHub): AiDecisionType {
  switch (hub) {
    case "buyer":
      return "BUYER_DECISION";
    case "seller":
      return "SELLER_DECISION";
    case "bnhub":
    case "rent":
      return "BNHUB_BOOKING_DECISION";
    case "broker":
      return "BROKER_LEAD_DECISION";
    case "mortgage":
      return "MORTGAGE_DECISION";
    case "investor":
      return "INVESTOR_DECISION";
    case "admin":
      return "ADMIN_DECISION";
    default:
      return "BUYER_DECISION";
  }
}
