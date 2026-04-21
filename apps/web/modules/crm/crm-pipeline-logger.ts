import { redactForLog } from "@/lib/security/redact";

type Tag = "[crm]" | "[pipeline]" | "[conversion]";

function emit(tag: Tag, level: "info" | "warn" | "error", msg: string, payload?: Record<string, unknown>): void {
  const line = `${tag} ${msg}`;
  const safe = payload !== undefined ? redactForLog(payload) : "";
  try {
    if (level === "info") console.info(line, safe ?? "");
    else if (level === "warn") console.warn(line, safe ?? "");
    else console.error(line, safe ?? "");
  } catch (e) {
    console.error("[crm] logging_failure", e instanceof Error ? e.message : String(e));
  }
}

export const crmLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[crm]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[crm]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[crm]", "error", msg, payload),
};

export const pipelineLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[pipeline]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[pipeline]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[pipeline]", "error", msg, payload),
};

export const conversionLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[conversion]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[conversion]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[conversion]", "error", msg, payload),
};
