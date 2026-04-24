/**
 * AI Broker Assistant — Québec residential brokerage guidance only.
 * Suggestions are non-binding until broker review / approval; platform does not replace broker judgment.
 */

export type BrokerAssistantLanguagePreference = "FR" | "EN" | "BILINGUAL";

export type BrokerAssistantDocumentType =
  | "promise_to_purchase"
  | "counter_offer"
  | "brokerage_contract"
  | "amendment"
  | "disclosure"
  | "email"
  | "note"
  | "other";

export type BrokerAssistantTransactionMode =
  | "represented_sale"
  | "represented_purchase"
  | "lease"
  | "fsbo_neutral"
  | "unknown";

export type BrokerAssistantOfferStatus =
  | "draft"
  | "submitted"
  | "countered"
  | "accepted"
  | "declined"
  | "unknown";

/** All assistant-generated payloads require broker review before any binding use. */
export type BrokerAssistantOutputStatus = "READY_FOR_REVIEW";

/** Aggregate compliance posture for the file (not a legal determination). */
export type BrokerAssistantComplianceLevel = "safe" | "needs_review" | "blocked_until_fixed";

export type MissingInformationItem = {
  id: string;
  fieldKey: string;
  messageFr: string;
  messageEn?: string;
  severity: "low" | "medium" | "high";
};

export type BrokerAssistantComplianceFlag = {
  id: string;
  code: string;
  messageFr: string;
  messageEn?: string;
  /** Maps to aggregate level when escalated */
  level: "info" | "warning" | "blocker";
};

export type SuggestedClauseRef = {
  categoryCode: string;
  titleFr: string;
  rationaleFr: string;
  rationaleEn?: string;
  /** Clause engine / library alignment — never auto-inserted */
  requiresBrokerReview: true;
};

export type DraftingSuggestion = {
  id: string;
  titleFr: string;
  bodyFr: string;
  bodyEn?: string;
  /** Explicit placeholders — assistant does not invent facts */
  placeholdersUsed: string[];
};

export type BrokerAssistantNextStep = {
  id: string;
  stepFr: string;
  stepEn?: string;
  requiresBrokerApproval: boolean;
};

export type BrokerAssistantOutput = {
  status: BrokerAssistantOutputStatus;
  complianceLevel: BrokerAssistantComplianceLevel;
  /** French-first executive summary (same as summaryFr; spec alias). */
  summary: string;
  summaryFr: string;
  summaryEn?: string;
  missingInformation: MissingInformationItem[];
  complianceFlags: BrokerAssistantComplianceFlag[];
  suggestedClauses: SuggestedClauseRef[];
  suggestedNextSteps: BrokerAssistantNextStep[];
  draftingSuggestions: DraftingSuggestion[];
  /** 0–1; low values force human review per safety rules */
  confidenceScore: number;
  disclaimersFr: string[];
  disclaimersEn?: string[];
};

export type BrokerAssistantParty = {
  role: "buyer" | "seller" | "broker";
  fullName?: string;
  email?: string;
  phone?: string;
};

export type BrokerAssistantContext = {
  caseId: string;
  dealId?: string;
  listingId?: string;
  documentType: BrokerAssistantDocumentType;
  transactionMode: BrokerAssistantTransactionMode;
  offerStatus: BrokerAssistantOfferStatus;
  languagePreference: BrokerAssistantLanguagePreference;

  listing?: {
    addressLine?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    listingTypeHint?: string;
  };

  parties: BrokerAssistantParty[];

  broker?: {
    displayName?: string;
    licenceNumberHint?: string;
    brokerDisclosureRecorded?: boolean;
  };

  conditions?: {
    financing?: { present?: boolean; deadline?: string };
    inspection?: { present?: boolean; deadline?: string };
    saleOfPurchasersProperty?: { present?: boolean };
  };

  dates?: {
    occupancyDate?: string;
    promiseDate?: string;
    financingDeadline?: string;
  };

  inclusionsExclusions?: {
    text?: string;
    complete?: boolean;
  };

  disclosures?: {
    sellerDeclarationAcknowledged?: boolean;
    conflictOfInterestDeclared?: boolean;
    brokerHasInterest?: boolean;
  };

  conflict?: {
    checkCompleted?: boolean;
    conflictIndicated?: boolean;
  };

  /** True when listing/situation is FSBO — assistant stays neutral / tool-only */
  fsboContext?: boolean;

  /** Raw draft for document/message flows */
  currentDraftText?: string;

  /** Public or client-facing — may trigger French-first reminders */
  isPublicOrClientFacing?: boolean;

  metadata?: Record<string, unknown>;
};

export type BrokerAssistantRunOptions = {
  includeDrafting?: boolean;
  includeClauses?: boolean;
  includeTranslationPreview?: boolean;
};

export type BrokerAssistantReviewDecision = "accepted" | "edited" | "rejected" | "approved_for_signature";

export type BrokerAssistantReviewRecord = {
  outputId: string;
  decision: BrokerAssistantReviewDecision;
  brokerUserId: string;
  decidedAt: string;
  notes?: string;
};
