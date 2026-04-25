import { logInfo } from "@/lib/logger";

const TAG = "[pricing-ai]";

export function logPricingAiSuggestion(meta: Record<string, unknown>) {
  logInfo(TAG, { kind: "suggestion", ...meta });
}

export function logPricingAiApplied(meta: Record<string, unknown>) {
  logInfo(TAG, { kind: "applied", ...meta });
}
