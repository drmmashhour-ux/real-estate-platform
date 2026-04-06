import { logWarn } from "@/lib/logger";

const FORBIDDEN_METADATA_KEYS = /pan|cvv|cvc|card.?number|password|secret/i;

/** Reject metadata that could carry cardholder data or secrets. */
export function assertSafeMetadata(metadata: Record<string, string> | undefined): Record<string, string> {
  if (!metadata || typeof metadata !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(metadata)) {
    if (FORBIDDEN_METADATA_KEYS.test(k)) {
      logWarn(`[payments] dropped unsafe metadata key: ${k}`);
      continue;
    }
    const s = String(v).slice(0, 500);
    out[k.slice(0, 64)] = s;
  }
  return out;
}
