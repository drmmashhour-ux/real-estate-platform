import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma";
import {
  SYRIA_INVESTOR_DEMO_AUTO_CLEAN_KEY,
  SYRIA_INVESTOR_DEMO_EXPIRES_AT_KEY,
  SYRIA_INVESTOR_DEMO_RUNTIME_KEY,
  SYRIA_INVESTOR_DEMO_SESSION_ID_KEY,
} from "@/lib/demo/runtime-flags";
import { appendSyriaSybnbCoreAudit } from "@/lib/sybnb/sybnb-financial-audit";
import { logSecurityEvent } from "@/lib/sybnb/sybnb-security-log";
import { logTimelineEvent } from "@/lib/timeline/log-event";

/** Must match {@link INVESTOR_DEMO_MODE_FORCE_OFF_ENV_KEY} — avoid importing investor-demo (load order). */
const INVESTOR_DEMO_MODE_FORCE_OFF = "INVESTOR_DEMO_MODE_FORCE_OFF" as const;

export const SYRIA_DEMO_SESSION_DURATION_MS = 60 * 60 * 1000;

/** Minimum interval between successful investor-demo resets (manual + automatic). */
export const SYRIA_DEMO_RESET_COOLDOWN_MS = 5 * 60 * 1000;

/** Minimum interval between successful demo auto-disables (Dr. Brain / demo-safety flap guard). */
export const SYRIA_DEMO_DISABLE_COOLDOWN_MS = 10 * 60 * 1000;

let lastInvestorDemoResetAt = 0;
let expireReentrancyLock = false;

export type DemoSessionPublicState = {
  sessionActive: boolean;
  expiresAtIso: string | null;
  sessionId: string | null;
  autoClean: boolean;
  remainingMinutes: number | null;
};

/**
 * Called at the top of {@link isInvestorDemoModeActive}. If the session TTL has passed, clears
 * runtime flags, forces demo off, optionally runs throttled investor-demo reset (non-demo rows only).
 */
export function syncInvestorDemoSessionExpiry(): void {
  if (expireReentrancyLock) return;
  const raw = process.env[SYRIA_INVESTOR_DEMO_EXPIRES_AT_KEY]?.trim();
  if (!raw) return;
  const expMs = Date.parse(raw);
  if (Number.isNaN(expMs) || Date.now() <= expMs) return;

  expireReentrancyLock = true;
  try {
    const autoClean = process.env[SYRIA_INVESTOR_DEMO_AUTO_CLEAN_KEY] === "true";

    delete process.env[SYRIA_INVESTOR_DEMO_RUNTIME_KEY];
    delete process.env[SYRIA_INVESTOR_DEMO_EXPIRES_AT_KEY];
    delete process.env[SYRIA_INVESTOR_DEMO_SESSION_ID_KEY];
    process.env[SYRIA_INVESTOR_DEMO_AUTO_CLEAN_KEY] = "false";
    delete process.env.DEMO_DATA_ENABLED;

    process.env[INVESTOR_DEMO_MODE_FORCE_OFF] = "true";

    const timestamp = new Date().toISOString();
    console.warn("[DEMO SESSION]", {
      type: "DEMO_SESSION_EXPIRED",
      timestamp,
      autoClean,
    });

    void logDemoSessionEvent("DEMO_SESSION_EXPIRED", { autoClean, timestamp }).catch(() => undefined);

    if (autoClean) {
      void runInvestorDemoResetThrottled("session_expired").catch(() => undefined);
    }
  } finally {
    expireReentrancyLock = false;
  }
}

export async function logDemoSessionEvent(
  event: string,
  meta: Record<string, string | boolean | number | null | undefined>,
): Promise<void> {
  const timestamp = new Date().toISOString();
  const payload = JSON.stringify({ ...meta, timestamp });
  console.warn("[DEMO SESSION]", { type: event, payloadLength: payload.length });
  try {
    const metaClean = Object.fromEntries(
      Object.entries({ ...meta, timestamp }).filter(([, v]) => v !== undefined),
    );
    await appendSyriaSybnbCoreAudit({
      bookingId: null,
      event,
      metadata: metaClean as Prisma.JsonObject,
    });
  } catch {
    /* best-effort */
  }
  await logSecurityEvent({
    action: "demo_session_event",
    metadata: {
      event,
      timestamp,
      ...meta,
    },
  });
}

export async function runInvestorDemoResetThrottled(source: string): Promise<{ skipped: boolean; error?: string }> {
  const now = Date.now();
  if (lastInvestorDemoResetAt !== 0 && now - lastInvestorDemoResetAt < SYRIA_DEMO_RESET_COOLDOWN_MS) {
    console.warn("[DEMO SESSION] reset skipped (cooldown)", { source });
    return { skipped: true };
  }

  try {
    const { prisma } = await import("@/lib/db");
    const { resetInvestorDemoData } = await import("@/lib/sybnb/investor-demo-reset");
    await resetInvestorDemoData(prisma);
    lastInvestorDemoResetAt = Date.now();
    await logDemoSessionEvent("DEMO_SESSION_CLEANED", { source });
    return { skipped: false };
  } catch (e) {
    const error = e instanceof Error ? e.message : "reset_failed";
    await logDemoSessionEvent("DEMO_SESSION_CLEANED", { source, error }).catch(() => undefined);
    return { skipped: false, error };
  }
}

export function getDemoSessionPublicState(): DemoSessionPublicState {
  const expiresAtIso = process.env[SYRIA_INVESTOR_DEMO_EXPIRES_AT_KEY]?.trim() ?? null;
  const sessionId = process.env[SYRIA_INVESTOR_DEMO_SESSION_ID_KEY]?.trim() ?? null;
  const runtimeOn = process.env[SYRIA_INVESTOR_DEMO_RUNTIME_KEY] === "true";
  const expMs = expiresAtIso ? Date.parse(expiresAtIso) : NaN;
  const remainingMinutes =
    Number.isFinite(expMs) && expiresAtIso ? Math.max(0, Math.ceil((expMs - Date.now()) / 60_000)) : null;

  const sessionActive = Boolean(runtimeOn && sessionId && expiresAtIso && Number.isFinite(expMs) && Date.now() <= expMs);

  return {
    sessionActive,
    expiresAtIso: sessionActive ? expiresAtIso : null,
    sessionId: sessionActive ? sessionId : null,
    autoClean: process.env[SYRIA_INVESTOR_DEMO_AUTO_CLEAN_KEY] === "true",
    remainingMinutes: sessionActive ? remainingMinutes : null,
  };
}

export type DemoSessionStartOptions = {
  /** Override default 60 minutes (ms). */
  durationMs?: number;
};

/**
 * Applies runtime env for a guided investor-demo session (process memory only — never edits .env files).
 */
export function applyInvestorDemoSessionStart(opts?: DemoSessionStartOptions): {
  sessionId: string;
  expiresAtIso: string;
} {
  const duration = opts?.durationMs ?? SYRIA_DEMO_SESSION_DURATION_MS;
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + duration);

  process.env[SYRIA_INVESTOR_DEMO_RUNTIME_KEY] = "true";
  process.env[SYRIA_INVESTOR_DEMO_EXPIRES_AT_KEY] = expiresAt.toISOString();
  process.env[SYRIA_INVESTOR_DEMO_SESSION_ID_KEY] = sessionId;
  process.env[SYRIA_INVESTOR_DEMO_AUTO_CLEAN_KEY] = "true";
  process.env.DEMO_DATA_ENABLED = "true";

  delete process.env[INVESTOR_DEMO_MODE_FORCE_OFF];

  return { sessionId, expiresAtIso: expiresAt.toISOString() };
}

export function applyInvestorDemoSessionStop(): { hadAutoClean: boolean; sessionId: string | null } {
  const hadAutoClean = process.env[SYRIA_INVESTOR_DEMO_AUTO_CLEAN_KEY] === "true";
  const sessionIdSnap = process.env[SYRIA_INVESTOR_DEMO_SESSION_ID_KEY]?.trim() ?? null;

  delete process.env[SYRIA_INVESTOR_DEMO_RUNTIME_KEY];
  delete process.env[SYRIA_INVESTOR_DEMO_EXPIRES_AT_KEY];
  delete process.env[SYRIA_INVESTOR_DEMO_SESSION_ID_KEY];
  process.env[SYRIA_INVESTOR_DEMO_AUTO_CLEAN_KEY] = "false";
  delete process.env.DEMO_DATA_ENABLED;

  process.env[INVESTOR_DEMO_MODE_FORCE_OFF] = "true";

  void logTimelineEvent({
    entityType: "investor_demo_session",
    entityId: sessionIdSnap ?? "unknown",
    action: "demo_session_stopped",
    metadata: { hadAutoClean },
  });

  return { hadAutoClean, sessionId: sessionIdSnap };
}
