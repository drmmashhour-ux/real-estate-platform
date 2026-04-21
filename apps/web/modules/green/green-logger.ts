import { redactForLog } from "@/lib/security/redact";

function emit(tag: "[green-system]" | "[esg-upgrade]" | "[certification]", level: "info" | "warn" | "error", msg: string, payload?: Record<string, unknown>) {
  const safe = payload !== undefined ? redactForLog(payload) : "";
  const line = `${tag} ${msg}`;
  try {
    if (level === "info") console.info(line, safe ?? "");
    else if (level === "warn") console.warn(line, safe ?? "");
    else console.error(line, safe ?? "");
  } catch {
    console.error("[green-system] logging_failure");
  }
}

export const greenSystemLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[green-system]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[green-system]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[green-system]", "error", msg, payload),
};

export const esgUpgradeLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[esg-upgrade]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[esg-upgrade]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[esg-upgrade]", "error", msg, payload),
};

export const greenCertificationLog = {
  info: (msg: string, payload?: Record<string, unknown>) => emit("[certification]", "info", msg, payload),
  warn: (msg: string, payload?: Record<string, unknown>) => emit("[certification]", "warn", msg, payload),
  error: (msg: string, payload?: Record<string, unknown>) => emit("[certification]", "error", msg, payload),
};
