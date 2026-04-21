/** Structured portfolio module logs — no PII beyond asset ids in production diagnostics. */

import { logInfo } from "@/lib/logger";

const PREFIX = {
  health: "[portfolio-health]",
  priority: "[portfolio-priority]",
  capital: "[portfolio-capital]",
  assetManager: "[asset-manager]",
  optimize: "[portfolio-optimize]",
  learning: "[portfolio-learning]",
  monitoring: "[portfolio-monitoring]",
} as const;

type LogPayload = Record<string, string | number | boolean | null | undefined>;

function emit(tag: string, message: string, payload?: LogPayload) {
  const meta =
    payload && Object.keys(payload).length > 0 ?
      { ...payload }
    : undefined;
  logInfo(`${tag} ${message}`, meta);
}

export const portfolioLog = {
  health: (msg: string, p?: LogPayload) => emit(PREFIX.health, msg, p),
  priority: (msg: string, p?: LogPayload) => emit(PREFIX.priority, msg, p),
  capital: (msg: string, p?: LogPayload) => emit(PREFIX.capital, msg, p),
  assetManager: (msg: string, p?: LogPayload) => emit(PREFIX.assetManager, msg, p),
  optimize: (msg: string, p?: LogPayload) => emit(PREFIX.optimize, msg, p),
  learning: (msg: string, p?: LogPayload) => emit(PREFIX.learning, msg, p),
  monitoring: (msg: string, p?: LogPayload) => emit(PREFIX.monitoring, msg, p),
};
