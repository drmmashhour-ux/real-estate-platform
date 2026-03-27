import { DraftConfidence } from "@/src/modules/ai-negotiation-deal-intelligence/domain/negotiationDraft.enums";

/** Optional Phase 1 negotiation / deal intelligence snapshot (passed from client or future API). */
export type NegotiationPlanSnapshot = {
  recommendedStrategy?: string;
  targetOfferApproach?: string;
  protectionsToInclude?: string[];
  readinessToProceed?: string;
  leverageLevel?: string;
  blockingIssues?: string[];
};

export type DraftSourceRef = {
  id: string;
  label: string;
  detail?: string;
};

/** Review-only counter draft — not sent automatically. */
export type CounterProposalDraftOutput = {
  summary: string;
  requestedChanges: string[];
  protections: string[];
  rationale: string;
  followUpRequests: string[];
  missingFacts: string[];
  confidence: DraftConfidence;
  sourceRefs: DraftSourceRef[];
  disclaimer: string;
};

export type NegotiationMessageDraftType =
  | "seller_clarification_request"
  | "buyer_guidance_note"
  | "broker_internal_summary"
  | "needs_more_documents_request"
  | "inspection_recommended_message"
  | "document_review_recommended_message";

export type NegotiationMessageDraftOutput = {
  draftType: NegotiationMessageDraftType;
  subject?: string;
  message: string;
  keyPoints: string[];
  assumptions: string[];
  missingFacts: string[];
  confidence: DraftConfidence;
  sourceRefs: DraftSourceRef[];
  disclaimer: string;
};

/** Grounded context assembled from DB + validation + graph + optional plan (no invented facts). */
export type GroundedNegotiationDraftContext = {
  listingId: string;
  documentId: string | null;
  listingTitle: string;
  city: string;
  listPriceFormatted: string | null;
  declarationStatus: string | null;
  missingFieldLabels: string[];
  blockingLabels: string[];
  warningLabels: string[];
  contradictionSummaries: string[];
  signatureReady: boolean | null;
  completenessPercent: number;
  riskScore: number | null;
  trustScore: number | null;
  negotiationPlan: NegotiationPlanSnapshot | null;
  desiredChanges: string[];
  userContext: { role?: string; strategyMode?: string };
  knowledgeSnippet: string | null;
  knowledgeSourceTitle: string | null;
  /**
   * Active negotiation version from `getNegotiationSnapshotForCase` / `getCurrentActiveVersionForListing` — single source of truth.
   * Drafting must not assume stale terms when `termsNotFinal` is true.
   */
  activeNegotiationVersion?: {
    chainId: string | null;
    versionNumber: number;
    status: string;
    isFinal: boolean;
    priceCents: number;
    depositCents: number | null;
    financingTerms: unknown;
    commissionTerms: unknown;
    deadlines: unknown;
    clauseTypesActive: string[];
    diffSummaryLines: string[];
    termsNotFinal: boolean;
  } | null;
};

export type GenerateCounterProposalInput = {
  propertyId: string;
  documentId?: string | null;
  userContext?: { role?: string; strategyMode?: string };
  negotiationPlan?: NegotiationPlanSnapshot | null;
  desiredChanges?: string[];
};

export type GenerateNegotiationMessageInput = {
  propertyId: string;
  documentId?: string | null;
  userContext?: { role?: string; strategyMode?: string };
  negotiationPlan?: NegotiationPlanSnapshot | null;
  desiredChanges?: string[];
  draftType: NegotiationMessageDraftType;
};
