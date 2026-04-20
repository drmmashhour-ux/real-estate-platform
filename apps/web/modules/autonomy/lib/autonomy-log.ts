import { redactForLog } from "@/lib/security/redact";

/** Structured, redacted autonomy OS logs — safe for production. */
export function logAutonomy(tag: string, payload?: Record<string, unknown>): void {
  try {
    const safe = payload ? redactForLog(payload) : "";
    console.info(tag, safe ?? "");
  } catch {
    /* never throw */
  }
}
