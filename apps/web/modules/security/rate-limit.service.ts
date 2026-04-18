/**
 * Named presets for consistent limits — wraps `lib/rate-limit` (in-memory; scale with Redis later).
 */
import { checkRateLimit, getRateLimitHeaders, type RateLimitOptions } from "@/lib/rate-limit";

export const rateLimitPresets = {
  login: { windowMs: 60_000, max: 5 } satisfies RateLimitOptions,
  apiDefault: { windowMs: 60_000, max: 120 } satisfies RateLimitOptions,
  stripeCheckout: { windowMs: 60_000, max: 20 } satisfies RateLimitOptions,
  bookingCreate: { windowMs: 60_000, max: 30 } satisfies RateLimitOptions,
  leadCapture: { windowMs: 60_000, max: 30 } satisfies RateLimitOptions,
  contentGeneration: { windowMs: 60_000, max: 24 } satisfies RateLimitOptions,
  autopilotRun: { windowMs: 60_000, max: 15 } satisfies RateLimitOptions,
} as const;

export function checkPreset(key: string, preset: keyof typeof rateLimitPresets) {
  return checkRateLimit(key, rateLimitPresets[preset]);
}

export { getRateLimitHeaders };
