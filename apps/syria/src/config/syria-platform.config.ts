/**
 * Central Syria / Darlink platform config — monetization, autonomy, safety.
 * Env overrides; defaults are conservative (no auto payout, review-first).
 */
import { SYRIA_PRICING } from "@/lib/pricing";

export type SyriaAutonomyMode = "OFF" | "ASSIST" | "SAFE_AUTOPILOT";

function envBool(key: string, defaultVal: boolean): boolean {
  const v = process.env[key];
  if (v === undefined || v === "") return defaultVal;
  return v === "true" || v === "1";
}

function envNum(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const syriaPlatformConfig = {
  monetization: {
    listingFeeAmount: SYRIA_PRICING.listingFeeAmount,
    featuredFeeAmount: SYRIA_PRICING.featuredBoostAmount,
    bnhubPlatformFeeRate: SYRIA_PRICING.bnhubCommissionRate,
    currency: SYRIA_PRICING.currency,
    /** F1 promotion window after admin confirms payment (days). */
    featuredDurationDays: envNum("SYRIA_FEATURED_DURATION_DAYS", 7),
    /** Optional BNHub-specific listing publish fee (same table purpose OTHER unless product adds enum). */
    bnhubListingFeeAmount: envNum("SYRIA_BNHUB_LISTING_FEE_AMOUNT", 0),
  },
  payouts: {
    /** Must stay false for safe operations unless explicitly enabled. */
    autoPayoutEnabled: envBool("AUTO_PAYOUT_ENABLED", false),
    /** Informational minimum hours guest payment should be verified before payout approve (policy helper). */
    payoutHoldMinHoursAfterCheckIn: envNum("SYRIA_PAYOUT_HOLD_MIN_HOURS", 0),
  },
  autonomy: {
    defaultMode: (process.env.SYRIA_AUTONOMY_MODE as SyriaAutonomyMode) || "OFF",
    /** Score thresholds (0–100) for suggestion triggers. */
    listingQualityAssistThreshold: envNum("SYRIA_LISTING_QUALITY_ASSIST_THRESHOLD", 65),
    staleListingDays: envNum("SYRIA_STALE_LISTING_DAYS", 45),
  },
  communications: {
    /** External auto-messaging disabled unless explicitly enabled. */
    externalMessagingAllowed: envBool("SYRIA_EXTERNAL_MESSAGING_ALLOWED", false),
  },
  analytics: {
    /** Max payload size for client event posts (bytes). */
    maxEventPayloadBytes: 8192,
  },
  /** ORDER SYBNB-113 — abuse-resistant growth signals (env-tunable). */
  sybn113: {
    maxSharesPerActorPerUtcDay: envNum("SYRIA_SYBN113_MAX_SHARES_PER_DAY", 20),
    burstWindowMs: envNum("SYRIA_SYBN113_BURST_WINDOW_MS", 10 * 60 * 1000),
    burstMaxFullWeightSharesSameListing: envNum("SYRIA_SYBN113_BURST_MAX_FULL_WEIGHT", 5),
    viralityWindowDays: envNum("SYRIA_SYBN113_VIRALITY_WINDOW_DAYS", 30),
    viralityTrustBoostPoints: envNum("SYRIA_SYBN113_VIRALITY_TRUST_BOOST", 4),
  },
} as const;

export function getSyriaAutonomyMode(): SyriaAutonomyMode {
  const m = process.env.SYRIA_AUTONOMY_MODE as SyriaAutonomyMode | undefined;
  if (m === "OFF" || m === "ASSIST" || m === "SAFE_AUTOPILOT") return m;
  return syriaPlatformConfig.autonomy.defaultMode;
}
