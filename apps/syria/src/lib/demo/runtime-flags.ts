/**
 * Syria-only investor demo runtime toggle. Mutates `process.env` for this Node process only — does not edit .env files.
 * Key: INVESTOR_DEMO_MODE_RUNTIME (independent from the Canada marketplace app in `apps/web`).
 */

export const SYRIA_INVESTOR_DEMO_RUNTIME_KEY = "INVESTOR_DEMO_MODE_RUNTIME" as const;
export const SYRIA_INVESTOR_DEMO_EXPIRES_AT_KEY = "INVESTOR_DEMO_MODE_EXPIRES_AT" as const;
export const SYRIA_INVESTOR_DEMO_SESSION_ID_KEY = "INVESTOR_DEMO_SESSION_ID" as const;
export const SYRIA_INVESTOR_DEMO_AUTO_CLEAN_KEY = "INVESTOR_DEMO_AUTO_CLEAN" as const;

export function getSyriaInvestorDemoRuntimeEnabled(): boolean {
  return process.env[SYRIA_INVESTOR_DEMO_RUNTIME_KEY] === "true";
}

export function getSyriaInvestorDemoExpiresAtIso(): string | undefined {
  const v = process.env[SYRIA_INVESTOR_DEMO_EXPIRES_AT_KEY]?.trim();
  return v || undefined;
}

export function setSyriaInvestorDemoRuntimeEnabled(enabled: boolean): void {
  if (enabled) {
    process.env[SYRIA_INVESTOR_DEMO_RUNTIME_KEY] = "true";
  } else {
    process.env[SYRIA_INVESTOR_DEMO_RUNTIME_KEY] = "false";
  }
}

/** Optional session metadata (ISO timestamp) — cleared by demo auto-disable. */
export function setSyriaInvestorDemoExpiresAt(isoTimestamp: string | null): void {
  if (isoTimestamp == null || isoTimestamp === "") {
    delete process.env[SYRIA_INVESTOR_DEMO_EXPIRES_AT_KEY];
  } else {
    process.env[SYRIA_INVESTOR_DEMO_EXPIRES_AT_KEY] = isoTimestamp;
  }
}

/**
 * Internal: set arbitrary env keys for runtime (process only). Used by demo safety helpers.
 */
export function setSyriaDemoRuntimeEnvKey(key: string, value: string | null): void {
  if (value === null || value === "") {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

export function getSyriaInvestorDemoSessionId(): string | undefined {
  return process.env[SYRIA_INVESTOR_DEMO_SESSION_ID_KEY]?.trim();
}

export function setSyriaInvestorDemoSessionId(id: string | null): void {
  setSyriaDemoRuntimeEnvKey(SYRIA_INVESTOR_DEMO_SESSION_ID_KEY, id);
}

export function getSyriaInvestorDemoAutoClean(): boolean {
  return process.env[SYRIA_INVESTOR_DEMO_AUTO_CLEAN_KEY] === "true";
}

export function setSyriaInvestorDemoAutoClean(enabled: boolean): void {
  process.env[SYRIA_INVESTOR_DEMO_AUTO_CLEAN_KEY] = enabled ? "true" : "false";
}
