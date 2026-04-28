import { assertEnvSafety } from "@repo/db/env-guard";
import { PRODUCTION_LOCK_MODE } from "@/config/sybnb.config";
import { syncInvestorDemoSessionExpiry } from "@/lib/demo/demo-session";

/**
 * Investor demo: fake data, stubbed payments, no real users or cards.
 * Defaults OFF. Never active in production unless INVESTOR_DEMO_IN_PRODUCTION=true.
 */
export const INVESTOR_DEMO_TITLE_PREFIX = "DEMO —";

/** Process-only failsafe set by demo auto-disable (does not edit .env files). */
export const INVESTOR_DEMO_MODE_FORCE_OFF_ENV_KEY = "INVESTOR_DEMO_MODE_FORCE_OFF" as const;

export function setInvestorDemoModeForceOff(): void {
  process.env[INVESTOR_DEMO_MODE_FORCE_OFF_ENV_KEY] = "true";
}

export function clearInvestorDemoModeForceOff(): void {
  delete process.env[INVESTOR_DEMO_MODE_FORCE_OFF_ENV_KEY];
}

function isVercelOrProdRuntime(): boolean {
  return process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL_ENV);
}

/**
 * Public demo hub / badges / stub payment path.
 */
export function isInvestorDemoModeActive(): boolean {
  syncInvestorDemoSessionExpiry();
  if (process.env[INVESTOR_DEMO_MODE_FORCE_OFF_ENV_KEY] === "true") return false;
  const demoRequested =
    process.env.INVESTOR_DEMO_MODE === "true" ||
    process.env.INVESTOR_DEMO_MODE_RUNTIME === "true";
  if (!demoRequested) return false;
  if (isVercelOrProdRuntime() && process.env.INVESTOR_DEMO_IN_PRODUCTION !== "true") {
    return false;
  }
  return true;
}

/**
 * Gated content that uses seeded demo rows (e.g. metrics).
 */
export function isDemoDataEnabled(): boolean {
  if (!isInvestorDemoModeActive()) return false;
  return process.env.DEMO_DATA_ENABLED === "true";
}

export function isDemoPaymentsStubMode(): boolean {
  const m = (process.env.DEMO_PAYMENTS_MODE ?? "stub").toLowerCase();
  return m === "stub" || m === "off" || m === "disabled" || m === "fake";
}

export function isDemoEmailsDisabled(): boolean {
  return process.env.DEMO_EMAILS_DISABLED !== "false";
}

export function isInvestorDemoUiPolished(): boolean {
  return isInvestorDemoModeActive();
}

/**
 * Call from seed/reset: refuse destructive demo ops against production without explicit allow + local DB heuristics.
 */
export function assertInvestorDemoSeedEnvironmentOk(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required for investor demo seed/reset.");
  }
  assertEnvSafety({
    appId: "syria",
    appEnv: process.env.APP_ENV || process.env.NODE_ENV,
    dbUrl: process.env.DATABASE_URL,
    demoMode: true,
  });
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  if (process.env.INVESTOR_DEMO_ALLOW_SEED_IN_PRODUCTION !== "true") {
    throw new Error(
      "Investor demo seed/reset is not allowed in NODE_ENV=production. Use a local/staging database or set INVESTOR_DEMO_ALLOW_SEED_IN_PRODUCTION with extreme caution.",
    );
  }
  const u = (process.env.DATABASE_URL ?? "").toLowerCase();
  if (u.includes("neon.tech") || u.includes("supabase.co") || u.includes("rds.amazonaws.com")) {
    throw new Error("Investor demo seed/reset: refuse cloud production-looking DATABASE_URL.");
  }
}

export function isDemoTitleDemoRecord(titleAr: string): boolean {
  return titleAr.startsWith(INVESTOR_DEMO_TITLE_PREFIX) || titleAr.trimStart().startsWith("DEMO ");
}

export function isDemoUserEmail(email: string): boolean {
  return email.startsWith("DEMO_") || email.includes("investor.sybnb.demo");
}

/** For UI badges; never show raw model risk to guests. */
export function canShowDemoBadgesOnSurface(): boolean {
  return isInvestorDemoModeActive();
}

export function isProductionLockActiveForDisplay(): boolean {
  return PRODUCTION_LOCK_MODE;
}
