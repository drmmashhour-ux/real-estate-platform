import type {
  TrustComponentBreakdown,
  TrustConfidenceBreakdown,
  TrustScoreResult,
} from "@/modules/trust-score/domain/trustScore.types";
import { trustLevelBand } from "@/modules/trust-score/domain/trustScore.types";

const EMPTY_BREAKDOWN: TrustComponentBreakdown = {
  addressValidity: 0,
  mediaQuality: 0,
  identityVerification: 0,
  sellerDeclarationCompleteness: 0,
  legalReadiness: 0,
  dataConsistency: 0,
};

const DEFAULT_CONF: TrustConfidenceBreakdown = {
  addressConfidence: 50,
  mediaConfidence: 50,
  identityConfidence: 50,
  declarationConfidence: 50,
  legalConfidence: 50,
};

/** For UI / explanations when full recompute is not needed — breakdown may be placeholder. */
export function trustResultFromListingAndCaseSummary(args: {
  trustScore: number | null | undefined;
  overallCaseScore?: number | null;
  summary: {
    issues?: string[];
    strengths?: string[];
    issueCodes?: string[];
    strengthCodes?: string[];
  } | null | undefined;
}): TrustScoreResult {
  const trustScore = args.trustScore ?? args.overallCaseScore ?? 0;
  const issues = Array.isArray(args.summary?.issues) ? args.summary!.issues! : [];
  const strengths = Array.isArray(args.summary?.strengths) ? args.summary!.strengths! : [];
  const issueCodes = Array.isArray(args.summary?.issueCodes) ? args.summary!.issueCodes! : [];
  const strengthCodes = Array.isArray(args.summary?.strengthCodes) ? args.summary!.strengthCodes! : [];
  return {
    trustScore,
    trustScoreRaw: trustScore,
    trustConfidence: 50,
    fraudPenalty: 0,
    level: trustLevelBand(trustScore),
    issues,
    strengths,
    issueCodes,
    strengthCodes,
    breakdown: EMPTY_BREAKDOWN,
    confidenceBreakdown: DEFAULT_CONF,
  };
}
