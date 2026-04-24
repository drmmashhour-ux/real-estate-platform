import type { LecipmTrustEngineTargetType, LecipmTrustOperationalBand } from "@prisma/client";

export type TrustFactorGroup =
  | "COMPLIANCE_DOCUMENTATION"
  | "RESPONSIVENESS_RELIABILITY"
  | "BOOKING_NOSHOW"
  | "DISPUTE_FRICTION"
  | "LISTING_DEAL_QUALITY"
  | "INSURANCE_COVERAGE";

export type TrustFactorInput = {
  id: string;
  group: TrustFactorGroup;
  /** Roughly -1 (concern) … +1 (positive signal). */
  normalized: number;
  rawNote: string;
};

export type OperationalTrustInputs = {
  targetType: LecipmTrustEngineTargetType;
  targetId: string;
  factors: TrustFactorInput[];
  warnings: string[];
  thinDataNotes: string[];
};

export type TrustFactorContribution = {
  factorId: string;
  group: TrustFactorGroup;
  weight: number;
  contribution: number;
  label: string;
};

export type OperationalTrustResult = {
  trustScore: number;
  trustBand: LecipmTrustOperationalBand;
  contributingFactors: TrustFactorContribution[];
  warnings: string[];
  explain: {
    topPositive: string[];
    topNegative: string[];
    bandReason: string;
    improvements: string[];
    declineNote?: string;
  };
  weightProfileVersion: string;
};

export type TrustHistoryEntry = {
  trustScore: number;
  trustBand: LecipmTrustOperationalBand;
  deltaFromPrior: number | null;
  changedFactorHints: string[];
  createdAt: string;
};

export type RankingModifier = {
  sortLift: number;
  prominenceLift: number;
  queuePriorityLift: number;
  note: string;
};
