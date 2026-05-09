/**
 * LECIPM Feature Flags — centralized hub-level feature gating.
 *
 * Each flag controls whether a hub is active in the current environment.
 * Default behavior is SAFE: public hubs render, internal hubs are protected,
 * risky payment/compliance functions are disabled unless explicitly enabled.
 *
 * Set via environment variables (Vercel project settings or .env).
 */

function envFlag(name: string, defaultValue: boolean): boolean {
  const v = process.env[name];
  if (v === "1" || v === "true") return true;
  if (v === "0" || v === "false") return false;
  return defaultValue;
}

/** Core platform (auth, shell, navigation) — always on. */
export const FEATURE_CORE = true;

/** LECIPM Homes — real estate marketplace (buy, sell, rent). Default: ON. */
export const FEATURE_HOMES = envFlag("FEATURE_HOMES", true);

/** BNHub — short-term stays marketplace. Default: ON. */
export const FEATURE_BNHUB = envFlag("FEATURE_BNHUB", true);

/** LECIPM Invest — investor tools, ROI, portfolio. Default: OFF (beta). */
export const FEATURE_INVEST = envFlag("FEATURE_INVEST", false);

/** LECIPM Forms — legal forms, signatures, OACIQ documents. Default: OFF (beta). */
export const FEATURE_FORMS = envFlag("FEATURE_FORMS", false);

/** ImmoContact — communication hub, AI assistant, lead routing. Default: ON. */
export const FEATURE_IMMOCONTACT = envFlag("FEATURE_IMMOCONTACT", true);

/** Dr Brain — admin intelligence, monitoring. Default: OFF (internal). */
export const FEATURE_DR_BRAIN = envFlag("FEATURE_DR_BRAIN", false);

/** Compliance Engine — OACIQ guardrails. Default: ON (fail-closed is safer). */
export const FEATURE_COMPLIANCE = envFlag("FEATURE_COMPLIANCE", true);

/**
 * Compliance hard lock — when enabled, ALL regulated actions are blocked
 * unless explicitly approved. Use during initial deployment to prevent
 * any payment/legal action until compliance is reviewed.
 */
export const FEATURE_COMPLIANCE_HARD_LOCK = envFlag("FEATURE_COMPLIANCE_HARD_LOCK", false);

/** Design System — internal dev tool. Default: OFF. */
export const FEATURE_DESIGN_SYSTEM = envFlag("FEATURE_DESIGN_SYSTEM", false);

/**
 * Check if a hub is enabled by its feature flag name.
 */
export function isHubEnabled(featureFlag: string): boolean {
  const flags: Record<string, boolean> = {
    FEATURE_CORE,
    FEATURE_HOMES,
    FEATURE_BNHUB,
    FEATURE_INVEST,
    FEATURE_FORMS,
    FEATURE_IMMOCONTACT,
    FEATURE_DR_BRAIN,
    FEATURE_COMPLIANCE,
    FEATURE_DESIGN_SYSTEM,
  };
  return flags[featureFlag] ?? false;
}
