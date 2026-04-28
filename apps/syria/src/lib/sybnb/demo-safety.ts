import { appendSyriaSybnbCoreAudit } from "@/lib/sybnb/sybnb-financial-audit";
import { logSecurityEvent } from "@/lib/sybnb/sybnb-security-log";
import { runInvestorDemoResetThrottled } from "@/lib/demo/demo-session";
import {
  setSyriaInvestorDemoExpiresAt,
  setSyriaInvestorDemoRuntimeEnabled,
  SYRIA_INVESTOR_DEMO_AUTO_CLEAN_KEY,
  SYRIA_INVESTOR_DEMO_SESSION_ID_KEY,
} from "@/lib/demo/runtime-flags";
import {
  clearInvestorDemoModeForceOff,
  isInvestorDemoModeActive,
  setInvestorDemoModeForceOff,
} from "@/lib/sybnb/investor-demo";
import { logTimelineEvent } from "@/lib/timeline/log-event";

const DEMO_DISABLE_COOLDOWN_MS = 10 * 60 * 1000;

let lastDemoDisableAt = 0;

export type DemoAutoDisabledBannerState = {
  reason: string;
  timestamp: string;
} | null;

let demoAutoDisabledBanner: DemoAutoDisabledBannerState = null;

export function getDemoAutoDisabledBanner(): DemoAutoDisabledBannerState {
  return demoAutoDisabledBanner;
}

/** Cleared when admin explicitly turns demo runtime back on (POST demo-toggle). */
export function clearDemoAutoDisabledBanner(): void {
  demoAutoDisabledBanner = null;
}

/**
 * Operator-facing alert hook — persists security audit metadata only (no external webhooks here).
 */
export async function sendSybnbAlert(input: {
  type: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
}): Promise<void> {
  const msg = input.message.slice(0, 2000);
  await logSecurityEvent({
    action: "sybnb_alert",
    metadata: {
      alertType: input.type,
      severity: input.severity,
      message: msg,
    },
  });
}

/**
 * Aligns with env keys `INVESTOR_DEMO_MODE_RUNTIME` / `INVESTOR_DEMO_MODE_EXPIRES_AT` (Syria process-local only).
 */
export function setRuntimeFlagInvestorDemoOff(): void {
  setSyriaInvestorDemoRuntimeEnabled(false);
  setSyriaInvestorDemoExpiresAt(null);
}

/**
 * Turns off investor demo for this Node process only when critical risk is detected.
 * Fraud/payment anomaly signals feeding DR.BRAIN exclude investor-demo audit rows (`demo-metrics-filter`).
 *
 * Rate-limited (10 minutes) to prevent alert flapping.
 */
export async function disableDemoModeSafely(reason: string): Promise<void> {
  if (!isInvestorDemoModeActive()) {
    return;
  }

  const now = Date.now();
  if (lastDemoDisableAt !== 0 && now - lastDemoDisableAt < DEMO_DISABLE_COOLDOWN_MS) {
    return;
  }

  const trimmedReason = reason.trim().slice(0, 1500);
  const timestamp = new Date().toISOString();
  const autoClean = process.env[SYRIA_INVESTOR_DEMO_AUTO_CLEAN_KEY] === "true";

  setRuntimeFlagInvestorDemoOff();
  delete process.env[SYRIA_INVESTOR_DEMO_SESSION_ID_KEY];
  process.env[SYRIA_INVESTOR_DEMO_AUTO_CLEAN_KEY] = "false";
  delete process.env.DEMO_DATA_ENABLED;
  setInvestorDemoModeForceOff();

  demoAutoDisabledBanner = { reason: trimmedReason, timestamp };
  lastDemoDisableAt = Date.now();

  console.error("[DEMO AUTO-DISABLED]", {
    type: "DEMO_AUTO_DISABLED",
    reason: trimmedReason,
    timestamp,
    autoClean,
  });

  try {
    await appendSyriaSybnbCoreAudit({
      bookingId: null,
      event: "DEMO_AUTO_DISABLED",
      metadata: {
        type: "DEMO_AUTO_DISABLED",
        reason: trimmedReason,
        timestamp,
        autoClean,
      },
    });
  } catch {
    /* best-effort */
  }

  await logSecurityEvent({
    action: "demo_auto_disabled",
    metadata: {
      type: "DEMO_AUTO_DISABLED",
      reason: trimmedReason,
      timestamp,
      autoClean,
    },
  });

  await sendSybnbAlert({
    type: "DEMO_DISABLED",
    severity: "CRITICAL",
    message: trimmedReason,
  });

  void logTimelineEvent({
    entityType: "investor_demo_runtime",
    entityId: "syria_live_process",
    action: "drbrain_critical_alert_demo_shutdown",
    metadata: {
      reasonPreview: trimmedReason.slice(0, 240),
      autoClean,
      timestamp,
    },
  });

  if (autoClean) {
    await runInvestorDemoResetThrottled("drbrain_critical");
  }
}

/** Demo-toggle POST calls this when operator manually turns demo runtime ON — clears failsafe latch + banner. */
export function acknowledgeManualDemoEnable(): void {
  clearInvestorDemoModeForceOff();
  clearDemoAutoDisabledBanner();
}
