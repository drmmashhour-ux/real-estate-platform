/**
 * LECIPM (apps/web) demo runtime toggle — mutates `process.env` for this Node process only; does not edit .env files.
 * Independent from Syria `INVESTOR_DEMO_MODE_RUNTIME`.
 */

import { flags } from "@/lib/flags";

export const LECIPM_DEMO_RUNTIME_ENV_KEY = "LECIPM_DEMO_MODE_RUNTIME" as const;

export function getLecipmDemoRuntimeEnabled(): boolean {
  return process.env[LECIPM_DEMO_RUNTIME_ENV_KEY] === "true";
}

export function setLecipmDemoRuntimeEnabled(enabled: boolean): void {
  if (enabled) {
    process.env[LECIPM_DEMO_RUNTIME_ENV_KEY] = "true";
  } else {
    delete process.env[LECIPM_DEMO_RUNTIME_ENV_KEY];
  }
}

/**
 * Effective demo for this process when cookie/request checks are not available — FEATURE_* gates OR runtime toggle.
 */
export function isLecipmDemoEffectiveWithoutRequest(): boolean {
  if (getLecipmDemoRuntimeEnabled()) return true;
  if (!flags.DEMO_MODE) return false;
  if (process.env.NODE_ENV === "production" && !flags.DEMO_MODE_PROD) return false;
  return true;
}
