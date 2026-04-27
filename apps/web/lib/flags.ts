/**
 * Env-gated feature switches (no deploy to flip). Prefer `1` to enable.
 * For broader launch rollouts, see `lib/launch/resolve-launch-flags.ts` + `lib/config/flags.ts`.
 */
export const flags = {
  AI_PRICING: process.env.FEATURE_AI_PRICING === "1",
  AUTONOMOUS_AGENT: process.env.FEATURE_AI_AGENT === "1",
  RECOMMENDATIONS: process.env.FEATURE_RECO === "1",
  /** Read-only demo dataset for APIs and tours — never mix into real tables (Order 61). */
  DEMO_MODE: process.env.FEATURE_DEMO_MODE === "1",
  /** Set on dedicated demo/prod host only — required with DEMO_MODE in production, or all demo data routes stay off. */
  DEMO_MODE_PROD: process.env.FEATURE_DEMO_MODE_PROD === "1",
  /**
   * Dev/staging: allow `lecipm_demo=1` cookie to enable demo data without full env (admin toggle).
   * Ignored in production.
   */
  DEMO_MODE_CLIENT_COOKIE: process.env.FEATURE_DEMO_MODE_CLIENT === "1",
  /**
   * Revenue optimization layer: `price = base * (1 + demand + weekend + season + occupancy)` with clamp (Order 62).
   * @see lib/market/revenueOptimizationLayer.ts
   */
  REVENUE_OPTIMIZATION_LAYER: process.env.FEATURE_REVENUE_OPTIMIZATION_LAYER === "1",
  /**
   * Daily autonomous optimization loop (signals → scored actions; audit + events only).
   * `FEATURE_AUTONOMOUS_OPTIMIZATION_LOOP=0` forces off even when `FEATURE_AI_AGENT=1`.
   */
  AUTONOMOUS_OPTIMIZATION_LOOP: (() => {
    const o = process.env.FEATURE_AUTONOMOUS_OPTIMIZATION_LOOP;
    if (o === "0" || o === "false") return false;
    if (o === "1" || o === "true") return true;
    return process.env.FEATURE_AI_AGENT === "1";
  })(),
  /**
   * Admin control-tower AI assistant (`/admin/assistant`, `/api/admin-ai/*`). Default **off** for stabilization.
   */
  AI_ASSISTANT: process.env.FEATURE_AI_ASSISTANT === "1",
  /**
   * OACIQ + BNHub: extra identity checks, IP velocity, price anomaly block, compliance audit events.
   * @see lib/compliance/hardLockAudit.ts, lib/security/bookingFraudGuard.ts
   */
  COMPLIANCE_HARD_LOCK: process.env.FEATURE_COMPLIANCE_HARD_LOCK === "1",
} as const;

export type FeatureFlags = typeof flags;
