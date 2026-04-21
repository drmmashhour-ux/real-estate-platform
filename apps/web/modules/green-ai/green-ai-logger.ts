import { redactForLog } from "@/lib/security/redact";

function emit(tag: "[green-ai]" | "[verification]" | "[certification]", level: "info" | "warn" | "error", msg: string, payload?: Record<string, unknown>) {
  const safe = payload !== undefined ? redactForLog(payload) : "";
  const line = `${tag} ${msg}`;
  try {
    if (level === "info") console.info(line, safe ?? "");
    else if (level === "warn") console.warn(line, safe ?? "");
    else console.error(line, safe ?? "");
  } catch {
    console.error("[green-ai] logging_failure");
  }
}

export const greenAiLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[green-ai]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[green-ai]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[green-ai]", "error", msg, payload),
};

export const verificationLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[verification]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[verification]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[verification]", "error", msg, payload),
};

export const certificationAiLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[certification]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[certification]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[certification]", "error", msg, payload),
};
