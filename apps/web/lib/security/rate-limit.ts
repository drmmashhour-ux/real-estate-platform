/**
 * Security-focused rate limiting presets. Core implementation remains in `@/lib/rate-limit`
 * and `@/lib/rate-limit-distributed` (Redis when configured).
 */
export {
  checkRateLimit,
  getRateLimitHeaders,
  clearRateLimitStore,
  type RateLimitOptions,
} from "@/lib/rate-limit";

export {
  checkRateLimitDistributed,
  getRateLimitHeadersFromResult,
  isIpRateLimitBlocked,
  maybeBlockIpAfterRateLimitDenied,
} from "@/lib/rate-limit-distributed";

/** Named presets (windowMs, max) — tune per environment. */
export const RATE_PRESETS = {
  login: { windowMs: 60_000, max: 20 },
  signup: { windowMs: 60_000, max: 10 },
  passwordReset: { windowMs: 3600_000, max: 8 },
  contactBroker: { windowMs: 60_000, max: 15 },
  messagingCreate: { windowMs: 60_000, max: 30 },
  bookingAttempt: { windowMs: 60_000, max: 40 },
  paymentSession: { windowMs: 60_000, max: 25 },
  searchHeavy: { windowMs: 60_000, max: 90 },
  adminAiHeavy: { windowMs: 60_000, max: 20 },
  webhookStripe: { windowMs: 60_000, max: 600 },
} as const;
