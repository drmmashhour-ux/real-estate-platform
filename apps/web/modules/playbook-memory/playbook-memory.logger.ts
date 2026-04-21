import { redactForLog } from "@/lib/security/redact";

type Level = "info" | "warn" | "error";

function emit(level: Level, msg: string, payload?: Record<string, unknown>): void {
  const line = `[playbook] ${msg}`;
  const safe = payload !== undefined ? redactForLog(payload) : "";
  try {
    if (level === "info") console.info(line, safe ?? "");
    else if (level === "warn") console.warn(line, safe ?? "");
    else console.error(line, safe ?? "");
  } catch (e) {
    console.error("[playbook] logging_failure", e instanceof Error ? e.message : String(e));
  }
}

export const playbookLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("error", msg, payload),
};
