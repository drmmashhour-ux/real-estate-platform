/**
 * Feature flags for multi-tenant rollout and gradual enablement.
 * Prefer env-backed flags in production.
 */
export const featureFlags = {
  /** Tenant-scoped data isolation enforced at the API layer */
  tenantIsolation: process.env.FEATURE_TENANT_ISOLATION === "true",
  /** Demo mode (staging / guided tours) */
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
} as const;

export type FeatureFlagKey = keyof typeof featureFlags;

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
