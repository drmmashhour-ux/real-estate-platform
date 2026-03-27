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
