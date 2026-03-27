/**
 * Registered FSBO listing rule codes (keep in sync with `verificationPipeline.ts`).
 */
export const TRUSTGRAPH_FSBO_LISTING_RULE_CODES = [
  "address_consistency",
  "listing_type_consistency",
  "media_completeness",
  "seller_declaration_completeness",
  "duplicate_media",
  "suspicious_pricing",
] as const;

export type TrustGraphFsboListingRuleCode = (typeof TRUSTGRAPH_FSBO_LISTING_RULE_CODES)[number];
