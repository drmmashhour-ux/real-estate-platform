import type {
  NextBestActionActorType,
  NextBestActionPriority,
  ReadinessLevel,
  TrustLevel,
  VerificationSignalCategory,
  VerificationSeverity,
} from "@prisma/client";

export type TrustGraphSignalDraft = {
  signalCode: string;
  signalName: string;
  category: VerificationSignalCategory;
  severity: VerificationSeverity;
  scoreImpact: number;
  confidence: number;
  evidence: Record<string, unknown>;
  message: string;
};

export type TrustGraphActionDraft = {
  actionCode: string;
  title: string;
  description: string;
  priority: NextBestActionPriority;
  actorType: NextBestActionActorType;
  metadata?: Record<string, unknown>;
};

/**
 * Output of a single deterministic rule (testable, no I/O hidden in the rule).
 */
export type RuleEvaluationResult = {
  ruleCode: string;
  ruleVersion: string;
  passed: boolean;
  scoreDelta: number;
  confidence: number;
  details: Record<string, unknown>;
  signals?: TrustGraphSignalDraft[];
  recommendedActions?: TrustGraphActionDraft[];
};

export type AggregatedTrustOutcome = {
  overallScore: number;
  trustLevel: TrustLevel;
  readinessLevel: ReadinessLevel;
};

/** Phase 6 — evidence enhancers for deterministic rules (never replaces user truth alone). */
export type Phase6ListingEvidence = {
  enabled: boolean;
  geospatial?: {
    precisionScore: number | null;
    cityMatch: boolean | null;
    warnings: string[];
  };
  extraction?: {
    normalizedPropertyType: string | null;
    confidence: number;
    reviewNeeded: boolean;
  };
  media?: {
    exteriorConfidence: number;
    streetConfidence: number;
    documentMismatch: boolean;
  };
  antifraud?: {
    duplicateHashCount: number;
    contactReuseSignals: number;
  };
};

/** Phase 8 — cross-border ruleset evidence (config-driven; no hardcoded jurisdiction in rules). */
export type Phase8ListingEvidence = {
  enabled: boolean;
  rulesetCode: string | null;
  missingRequirements: string[];
};

export type FsboListingRuleContext = {
  listingId: string;
  ownerId: string;
  sellerPlan: string | null;
  title: string;
  description: string;
  address: string;
  city: string;
  /** List price in cents (for pricing rules). */
  priceCents: number;
  propertyType: string | null;
  images: string[];
  photoTagsJson: unknown;
  sellerDeclarationJson: unknown;
  sellerDeclarationCompletedAt: Date | null;
  /** Populated when Phase 6 flags allow — rules must treat missing as neutral. */
  phase6?: Phase6ListingEvidence;
  /** Populated when Phase 8 compliance rulesets are enabled. */
  phase8?: Phase8ListingEvidence;
};

export type ListingRuleRunOptions = {
  duplicateSha256AcrossOtherListings: string[];
  duplicateSha256WithinListing: string[];
  duplicateImageUrlsWithinListing?: string[];
};

/** Broker profile verification (entity `BROKER`). */
export type BrokerVerificationRuleContext = {
  userId: string;
  email: string | null;
  displayName: string | null;
  phone: string | null;
  licenseNumber: string | null;
  brokerageCompany: string | null;
};
