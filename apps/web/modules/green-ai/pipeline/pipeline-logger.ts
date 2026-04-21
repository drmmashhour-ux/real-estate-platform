import { redactForLog } from "@/lib/security/redact";

function emit(tag: "[pipeline]" | "[grant]" | "[contractor]", level: "info" | "warn" | "error", msg: string, payload?: Record<string, unknown>) {
  const safe = payload !== undefined ? redactForLog(payload) : "";
  const line = `${tag} ${msg}`;
  try {
    if (level === "info") console.info(line, safe ?? "");
    else if (level === "warn") console.warn(line, safe ?? "");
    else console.error(line, safe ?? "");
  } catch {
    console.error("[pipeline] logging_failure");
  }
}

export const pipelineLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[pipeline]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[pipeline]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[pipeline]", "error", msg, payload),
};

export const grantPipelineLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[grant]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[grant]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[grant]", "error", msg, payload),
};

export const contractorPipelineLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[contractor]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[contractor]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[contractor]", "error", msg, payload),
};
