/**
 * Feature flags for multi-tenant rollout and gradual enablement.
 * Prefer env-backed flags in production.
 */
export const featureFlags = {
  /** Tenant-scoped data isolation enforced at the API layer */
  tenantIsolation: process.env.FEATURE_TENANT_ISOLATION === "true",
  /** Demo mode (staging / guided tours) */
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
  /**
   * Deal coordination hub — also check DB `featureFlag` keys:
   * document_request_autopilot_v1, bank_coordination_v1, notary_coordination_hub_v1,
   * request_communications_v1, closing_request_validation_v1
   * @see lib/deals/coordination-feature-flags.ts
   */
  documentRequestAutopilotV1: process.env.FEATURE_DOCUMENT_REQUEST_AUTOPILOT_V1 === "true",
  bankCoordinationV1: process.env.FEATURE_BANK_COORDINATION_V1 === "true",
  notaryCoordinationHubV1: process.env.FEATURE_NOTARY_COORDINATION_HUB_V1 === "true",
  requestCommunicationsV1: process.env.FEATURE_REQUEST_COMMUNICATIONS_V1 === "true",
  closingRequestValidationV1: process.env.FEATURE_CLOSING_REQUEST_VALIDATION_V1 === "true",
} as const;

export type FeatureFlagKey = keyof typeof featureFlags;

/**
 * LECIPM engine foundations (ranking, core autopilot, growth) — env-backed; default off in production unless set.
 * TODO v2: per-tenant overrides in DB; experiments / A-B testing integration.
 */
export const engineFlags = {
  rankingV1: process.env.FEATURE_RANKING_V1 === "true" || process.env.FEATURE_RANKING_V1 === "1",
  listingQualityV1: process.env.FEATURE_LISTING_QUALITY_V1 === "true" || process.env.FEATURE_LISTING_QUALITY_V1 === "1",
  listingAutopilotV1: process.env.FEATURE_LISTING_AUTOPILOT_V1 === "true" || process.env.FEATURE_LISTING_AUTOPILOT_V1 === "1",
  growthAutopilotV1: process.env.FEATURE_GROWTH_AUTOPILOT_V1 === "true" || process.env.FEATURE_GROWTH_AUTOPILOT_V1 === "1",
  seoCandidateGenerationV1:
    process.env.FEATURE_SEO_CANDIDATE_GENERATION_V1 === "true" || process.env.FEATURE_SEO_CANDIDATE_GENERATION_V1 === "1",
  reengagementCandidatesV1:
    process.env.FEATURE_REENGAGEMENT_CANDIDATES_V1 === "true" || process.env.FEATURE_REENGAGEMENT_CANDIDATES_V1 === "1",
} as const;

export type EngineFlagKey = keyof typeof engineFlags;

/** Soft-launch toggles (default: locales on; risky automation off unless env enables). */
export const launchFlags = {
  enableArabic: process.env.ENABLE_ARABIC !== "false",
  enableFrench: process.env.ENABLE_FRENCH !== "false",
  enableSyriaMarket: process.env.ENABLE_SYRIA_MARKET === "true" || process.env.ENABLE_SYRIA_MARKET === "1",
  enableManualBookings: process.env.ENABLE_MANUAL_BOOKINGS !== "false",
  enableManualPayments: process.env.ENABLE_MANUAL_PAYMENTS !== "false",
  enableContactFirstUx: process.env.ENABLE_CONTACT_FIRST_UX !== "false",
  /** Draft/review UI and generators (distinct from publish kill switch). */
  enableAiContentEngine: process.env.ENABLE_AI_CONTENT_ENGINE !== "false",
  enableAiContentPublish: process.env.ENABLE_AI_CONTENT_PUBLISH === "true" || process.env.ENABLE_AI_CONTENT_PUBLISH === "1",
  enablePublicCityPages: process.env.ENABLE_PUBLIC_CITY_PAGES !== "false",
  enableMobileBookings: process.env.ENABLE_MOBILE_BOOKINGS !== "false",
} as const;

export type LaunchFlagKey = keyof typeof launchFlags;
