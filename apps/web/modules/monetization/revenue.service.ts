import { listRevenueStreams, getMonetizationEnvSummary } from "./revenue-stream.service";
import { recordLecipmRevenueAttribution } from "@/lib/monetization/lecipm-financial-operations";

export { listRevenueStreams, getMonetizationEnvSummary };

/**
 * Record an analytics-friendly revenue attribution row (not a legal revenue recognition entry).
 */
export async function recordRevenueAttributionEvent(input: {
  source: string;
  amount: number;
  category: string;
  referenceId?: string | null;
  currency?: string;
}) {
  return recordLecipmRevenueAttribution(input);
}
