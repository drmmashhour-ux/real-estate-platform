import { redactForLog, redactSensitiveText } from "@/lib/security/redact";

export function logInfo(message: string, meta?: unknown) {
  const safeMeta = meta !== undefined ? redactForLog(meta) : "";
  console.info(`[INFO] ${redactSensitiveText(message)}`, safeMeta);
}

export function logWarn(message: string, meta?: unknown) {
  const safeMeta = meta !== undefined ? redactForLog(meta) : "";
  console.warn(`[WARN] ${redactSensitiveText(message)}`, safeMeta);
}

export function logError(message: string, error?: unknown) {
  const safeErr = error !== undefined ? redactForLog(error) : "";
  console.error(`[ERROR] ${redactSensitiveText(message)}`, safeErr);
}
