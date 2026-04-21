/** Structured logs for observability — no PII in payloads. */

export function logListingAssistant(scope: string, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length > 0) console.log(`[listing-assistant] ${scope}`, meta);
  else console.log(`[listing-assistant] ${scope}`);
}

export function logAiGeneration(scope: string, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length > 0) console.log(`[ai-generation] ${scope}`, meta);
  else console.log(`[ai-generation] ${scope}`);
}

export function logComplianceCheck(scope: string, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length > 0) console.log(`[compliance-check] ${scope}`, meta);
  else console.log(`[compliance-check] ${scope}`);
}
