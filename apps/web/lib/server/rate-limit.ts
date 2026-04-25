import { NextResponse } from "next/server";
import { logSecurity } from "./logger";

// Simple memory cache for rate limiting (reset on restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
};

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const existing = rateLimitMap.get(identifier);

  if (!existing || now > existing.resetAt) {
    const resetAt = now + config.windowMs;
    rateLimitMap.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetInMs: config.windowMs };
  }

  if (existing.count >= config.maxRequests) {
    logSecurity(`Rate limit exceeded for ${identifier}`);
    return { allowed: false, remaining: 0, resetInMs: existing.resetAt - now };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    resetInMs: existing.resetAt - now,
  };
}

export function getRateLimitHeaders(remaining: number, resetInMs: number) {
  return {
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(resetInMs / 1000).toString(),
  };
}
