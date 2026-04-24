import { redactForLog } from "@/lib/security/redact";

type Level = "info" | "warn" | "error";

function emit(tag: string, level: Level, msg: string, payload?: Record<string, unknown>) {
  const line = `${tag} ${msg}`;
  const safe = payload !== undefined ? redactForLog(payload) : "";
  try {
    if (level === "info") console.info(line, safe ?? "");
    else if (level === "warn") console.warn(line, safe ?? "");
    else console.error(line, safe ?? "");
  } catch (e) {
    console.error(`${tag} logging_failure`, e instanceof Error ? e.message : String(e));
  }
}

/** [assignment] — auditable selection / touchpoint (additive; never throw). */
export const assignmentLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[assignment]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[assignment]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[assignment]", "error", msg, payload),
};

/** [bandit] — stat / reward path (additive; never throw). */
export const banditLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[bandit]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[bandit]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[bandit]", "error", msg, payload),
};
