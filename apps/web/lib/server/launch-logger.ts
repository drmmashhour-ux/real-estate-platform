/**
 * Structured server logs for production — narrow tags only (no noisy printf debugging).
 */

import { redactForLog } from "@/lib/security/redact";

type Tag =
  | "[api]"
  | "[stripe]"
  | "[booking]"
  | "[autopilot]"
  | "[compliance]"
  | "[deal]"
  | "[lead]";

function emit(tag: Tag, level: "info" | "warn" | "error", msg: string, payload?: Record<string, unknown>): void {
  const line = `${tag} ${msg}`;
  const safePayload = payload ? redactForLog(payload) : "";
  try {
    if (level === "info") console.info(line, safePayload ?? "");
    else if (level === "warn") console.warn(line, safePayload ?? "");
    else console.error(line, safePayload ?? "");
  } catch {
    /* never throw from logging */
  }
}

export const logApi = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[api]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[api]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[api]", "error", msg, payload),
};

export const logStripeTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[stripe]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[stripe]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[stripe]", "error", msg, payload),
};

export const logBooking = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[booking]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[booking]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[booking]", "error", msg, payload),
};

export const logAutopilotTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[autopilot]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[autopilot]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[autopilot]", "error", msg, payload),
};

export const logComplianceTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[compliance]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[compliance]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[compliance]", "error", msg, payload),
};

export const logDealTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[deal]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[deal]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[deal]", "error", msg, payload),
};

export const logLeadTagged = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[lead]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[lead]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[lead]", "error", msg, payload),
};
