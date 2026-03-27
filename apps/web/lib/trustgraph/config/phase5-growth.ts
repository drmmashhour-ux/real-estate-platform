/**
 * Phase 5 growth layer — thresholds and weights (no magic numbers in services).
 * Tune via env-backed overrides where noted in `getPhase5GrowthConfig()`.
 */
import { z } from "zod";

const num = (v: string | undefined, fallback: number) => {
  const n = v != null && v !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

const phase5GrowthConfigSchema = z.object({
  ranking: z.object({
    /** Max additive boost applied on top of normalized base score (0–1 scale). */
    maxTrustBoost: z.number().min(0).max(1),
    trustLevelWeight: z.object({
      verified: z.number(),
      high: z.number(),
      medium: z.number(),
      low: z.number(),
    }),
    readinessWeight: z.object({
      ready: z.number(),
      partial: z.number(),
      not_ready: z.number(),
      action_required: z.number(),
    }),
    mediaCompletenessBonus: z.number(),
    declarationCompleteBonus: z.number(),
    brokerVerifiedBonus: z.number(),
  }),
  leadRouting: z.object({
    trustScoreWeight: z.number(),
    brokerVerifiedBonus: z.number(),
    licenseRulePassBonus: z.number(),
    minNonVerifiedWeight: z.number(),
  }),
  investorOpportunity: z.object({
    minTrustScoreForVerifiedOpportunity: z.number(),
    minTrustLevel: z.enum(["low", "medium", "high", "verified"]),
    requireNoActionRequiredReadiness: z.boolean(),
  }),
  bnhubBooking: z.object({
    shortNoticeHours: z.number(),
    highValueCents: z.number(),
    depositRecommendAboveCents: z.number(),
  }),
  mortgageReadiness: z.object({
    minIncome: z.number(),
    requiredFields: z.array(z.string()),
  }),
  publicBadgeCopy: z.object({
    verifiedListing: z.string(),
    highTrust: z.string(),
    completeListing: z.string(),
  }),
});

export type Phase5GrowthConfig = z.infer<typeof phase5GrowthConfigSchema>;

export function getPhase5GrowthConfig(): Phase5GrowthConfig {
  const raw: Phase5GrowthConfig = {
    ranking: {
      maxTrustBoost: num(process.env.TRUSTGRAPH_RANKING_MAX_BOOST, 0.12),
      trustLevelWeight: {
        verified: num(process.env.TRUSTGRAPH_RANKING_TL_VERIFIED, 1),
        high: num(process.env.TRUSTGRAPH_RANKING_TL_HIGH, 0.72),
        medium: num(process.env.TRUSTGRAPH_RANKING_TL_MEDIUM, 0.38),
        low: num(process.env.TRUSTGRAPH_RANKING_TL_LOW, 0.08),
      },
      readinessWeight: {
        ready: num(process.env.TRUSTGRAPH_RANKING_RD_READY, 0.35),
        partial: num(process.env.TRUSTGRAPH_RANKING_RD_PARTIAL, 0.12),
        not_ready: num(process.env.TRUSTGRAPH_RANKING_RD_NOT_READY, 0.04),
        action_required: num(process.env.TRUSTGRAPH_RANKING_RD_ACTION, 0),
      },
      mediaCompletenessBonus: num(process.env.TRUSTGRAPH_RANKING_MEDIA_BONUS, 0.03),
      declarationCompleteBonus: num(process.env.TRUSTGRAPH_RANKING_DECL_BONUS, 0.02),
      brokerVerifiedBonus: num(process.env.TRUSTGRAPH_RANKING_BROKER_BONUS, 0.02),
    },
    leadRouting: {
      trustScoreWeight: num(process.env.TRUSTGRAPH_LEAD_TRUST_WEIGHT, 0.45),
      brokerVerifiedBonus: num(process.env.TRUSTGRAPH_LEAD_VERIFIED_BONUS, 12),
      licenseRulePassBonus: num(process.env.TRUSTGRAPH_LEAD_LICENSE_BONUS, 8),
      minNonVerifiedWeight: num(process.env.TRUSTGRAPH_LEAD_MIN_UNVERIFIED, 0.15),
    },
    investorOpportunity: {
      minTrustScoreForVerifiedOpportunity: num(process.env.TRUSTGRAPH_INVESTOR_MIN_SCORE, 72),
      minTrustLevel: (() => {
        const v = process.env.TRUSTGRAPH_INVESTOR_MIN_TL?.trim().toLowerCase();
        if (v === "low" || v === "medium" || v === "high" || v === "verified") return v;
        return "high" as const;
      })(),
      requireNoActionRequiredReadiness:
        process.env.TRUSTGRAPH_INVESTOR_BLOCK_ACTION_REQ === "false" ? false : true,
    },
    bnhubBooking: {
      shortNoticeHours: num(process.env.TRUSTGRAPH_BNHUB_SHORT_NOTICE_H, 48),
      highValueCents: num(process.env.TRUSTGRAPH_BNHUB_HIGH_VALUE_CENTS, 500_000),
      depositRecommendAboveCents: num(process.env.TRUSTGRAPH_BNHUB_DEPOSIT_AT_CENTS, 400_000),
    },
    mortgageReadiness: {
      minIncome: num(process.env.TRUSTGRAPH_MORTGAGE_MIN_INCOME, 1),
      requiredFields: ["propertyPrice", "downPayment", "income", "timeline"],
    },
    publicBadgeCopy: {
      verifiedListing: "Verified Listing",
      highTrust: "High Trust",
      completeListing: "Complete Listing",
    },
  };
  return phase5GrowthConfigSchema.parse(raw);
}
