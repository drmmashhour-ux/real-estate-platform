import type { MemoryDomain } from "@prisma/client";
import type { PlaybookOrMemoryRecommendation, PlaybookRecommendation } from "@/modules/playbook-memory/types/playbook-memory.types";

/**
 * Versioned, domain-agnostic representation of explicit / normalized features for cross-domain match.
 * No protected attributes — only caller-supplied keys and structural hints.
 */
export type SharedContextRepresentation = {
  version: 1;
  /** Source domain the request or entity originated from (for gating, not for trait inference). */
  originDomain: string;
  /** Normalized, sorted feature map. */
  features: Record<string, string | number | boolean | null>;
  /** Subset: explicit end-user or operator-provided fields (Dream Home, filters, etc.). */
  explicitPreferences?: Record<string, string | number | boolean | null>;
  marketHints?: Record<string, string | null>;
  segmentHints?: Record<string, string | null>;
};

export type CrossDomainCandidate = {
  itemType: "playbook";
  playbook: PlaybookRecommendation;
  sharedFeatureFit: number;
  compatibilityScore: number;
  transferPenalty: number;
  blockedReasons: string[];
  rationale: string[];
};

export type CrossDomainRecommendationResult = {
  requestShared: SharedContextRepresentation | null;
  requestDomain: MemoryDomain;
  nativeCandidates: PlaybookRecommendation[];
  crossCandidates: CrossDomainCandidate[];
};

export type TransferEligibilityResult = {
  allowed: boolean;
  blockedReasons: string[];
  transferPenalty: number;
  compatibilityScore: number;
};

export type CrossDomainIntelligenceResult = {
  recommendations: PlaybookOrMemoryRecommendation[];
  source: "native_only" | "native_plus_transfer" | "transfer_fallback" | "memory_fallback" | "none";
  /** True if any `transfer` recommendation is included. */
  transferUsed: boolean;
};
