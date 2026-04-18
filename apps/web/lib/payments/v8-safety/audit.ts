/**
 * Structured audit logging for V8 safety layer (no DB financial writes).
 */
import { logInfo } from "@/lib/logger";

const NS = "[payments:v8:safety:audit]";

export function auditV8PaymentSafety(
  phase: "start" | "success" | "failure" | "duplicate_hint" | "validation_block",
  opName: string,
  meta?: Record<string, unknown>,
): void {
  logInfo(NS, { phase, opName, ...meta });
}
