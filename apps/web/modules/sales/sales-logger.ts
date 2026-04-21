/**
 * Structured logs for sales automation & broker onboarding (narrow tags).
 * Tags: [onboarding], [sales], [conversion]
 */

import { redactForLog } from "@/lib/security/redact";

type OnboardingTag = "[onboarding]";
type SalesTag = "[sales]";
type ConversionTag = "[conversion]";

function emitOnboarding(level: "info" | "warn" | "error", msg: string, payload?: Record<string, unknown>): void {
  const line = `[onboarding] ${msg}`;
  const safe = payload !== undefined ? redactForLog(payload) : "";
  try {
    if (level === "info") console.info(line, safe ?? "");
    else if (level === "warn") console.warn(line, safe ?? "");
    else console.error(line, safe ?? "");
  } catch {
    console.error("[onboarding] logging_failure");
  }
}

function emitSales(level: "info" | "warn" | "error", msg: string, payload?: Record<string, unknown>): void {
  const line = `[sales] ${msg}`;
  const safe = payload !== undefined ? redactForLog(payload) : "";
  try {
    if (level === "info") console.info(line, safe ?? "");
    else if (level === "warn") console.warn(line, safe ?? "");
    else console.error(line, safe ?? "");
  } catch {
    console.error("[sales] logging_failure");
  }
}

function emitSalesConversion(level: "info" | "warn" | "error", msg: string, payload?: Record<string, unknown>): void {
  const line = `[conversion] ${msg}`;
  const safe = payload !== undefined ? redactForLog(payload) : "";
  try {
    if (level === "info") console.info(line, safe ?? "");
    else if (level === "warn") console.warn(line, safe ?? "");
    else console.error(line, safe ?? "");
  } catch {
    console.error("[conversion] logging_failure");
  }
}

export const onboardingLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emitOnboarding("info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emitOnboarding("warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emitOnboarding("error", msg, payload),
};

export const salesLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emitSales("info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emitSales("warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emitSales("error", msg, payload),
};

/** [conversion] — sales funnel outcomes (distinct from CRM `conversionLog` imports when both used). */
export const salesConversionLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emitSalesConversion("info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emitSalesConversion("warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emitSalesConversion("error", msg, payload),
};
