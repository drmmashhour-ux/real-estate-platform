import type { AutonomyActionCandidate, PolicyResult } from "@/modules/autonomy/autonomy.types";
import type { AutonomyConfig } from "@prisma/client";

function isQuietHourUtc(start: number | null | undefined, end: number | null | undefined): boolean {
  if (start == null || end == null) return false;
  const h = new Date().getUTCHours();
  if (start <= end) {
    return h >= start && h < end;
  }
  return h >= start || h < end;
}

/** Hard guardrails — must pass before any execution path. */
export function evaluatePolicies(config: AutonomyConfig, action: AutonomyActionCandidate): PolicyResult {
  if (!config.isEnabled) {
    return { allowed: false, reason: "Autonomy disabled for scope" };
  }

  if (config.mode === "OFF") {
    return { allowed: false, reason: "Mode OFF" };
  }

  if (isQuietHourUtc(config.quietHoursStartUtc, config.quietHoursEndUtc)) {
    return { allowed: false, reason: "Quiet hours — no autonomous actions" };
  }

  if (action.domain === "pricing" && !config.autoPricing) {
    return { allowed: false, reason: "autoPricing disabled" };
  }
  if (action.domain === "promotions" && !config.autoPromotions) {
    return { allowed: false, reason: "autoPromotions disabled" };
  }
  if (action.domain === "messaging" && !config.autoMessaging) {
    return { allowed: false, reason: "autoMessaging disabled" };
  }
  if (action.domain === "listing" && !config.autoListingOptimization) {
    return { allowed: false, reason: "autoListingOptimization disabled" };
  }

  if (action.domain === "pricing") {
    const pct = Math.abs(Number(action.payload.pct ?? 0));
    if (config.maxPriceChangePct != null && pct > config.maxPriceChangePct + 1e-9) {
      return { allowed: false, reason: "Price change exceeds maxPriceChangePct" };
    }
  }

  if (action.domain === "promotions") {
    const disc = Math.abs(Number(action.payload.pct ?? 0));
    if (config.maxDiscountPct != null && disc > config.maxDiscountPct + 1e-9) {
      return { allowed: false, reason: "Discount exceeds maxDiscountPct" };
    }
  }

  return { allowed: true };
}
