import type { LegalHubSummary } from "@/modules/legal/legal.types";
import type { LegalIntelligenceSummary } from "@/modules/legal/legal-intelligence.types";
import { computeTrustBadges, type TrustBadgeContext } from "./trust-badge.service";
import { computeTrustScore, type ComputeTrustScoreParams } from "./trust-score.service";
import { computeVisibilityImpact } from "./trust-visibility.service";
import type { PublicTrustPayload } from "./trust.types";

export type BuildPublicTrustPayloadInput = ComputeTrustScoreParams & {
  legalSummary?: LegalHubSummary | null;
  intelligenceSummary?: LegalIntelligenceSummary | null;
  badgeContext?: TrustBadgeContext;
  includeBadges?: boolean;
};

export function buildPublicTrustPayload(input: BuildPublicTrustPayloadInput): PublicTrustPayload {
  const ts = computeTrustScore(input);
  const vis = computeVisibilityImpact(ts);
  const badges =
    input.includeBadges === false
      ? []
      : computeTrustBadges(
          ts,
          input.legalSummary ?? null,
          input.intelligenceSummary ?? null,
          input.badgeContext,
        );
  return {
    score: ts.score,
    level: ts.level,
    confidence: ts.confidence,
    badges,
    factors: ts.factors,
    visibility: vis,
  };
}
