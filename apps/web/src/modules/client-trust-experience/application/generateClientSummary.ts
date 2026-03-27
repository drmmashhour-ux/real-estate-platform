import { buildClientSummaryFromPayload } from "@/src/modules/client-trust-experience/infrastructure/clientSummaryService";
import type { ClientTrustSummary } from "@/src/modules/client-trust-experience/domain/clientExperience.types";

export function generateClientSummary(payload: Record<string, unknown>, aiSummary?: Record<string, unknown> | null): ClientTrustSummary {
  const base = buildClientSummaryFromPayload(payload);
  let priceLine = base.priceLine;
  if (!priceLine && aiSummary && typeof aiSummary === "object") {
    const p = aiSummary.price ?? aiSummary.listPrice ?? aiSummary.askingPrice;
    if (p !== undefined && p !== null && String(p).trim()) {
      priceLine = `Price (from summary data): ${String(p).trim()}`;
    }
  }
  return {
    ...base,
    priceLine,
  };
}
