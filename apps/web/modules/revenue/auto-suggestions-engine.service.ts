/**
 * Advisory auto-suggestions — text only; never mutates pricing or listings.
 */

import type { AutoSuggestion } from "./money-os.types";
import type { RevenueDashboardSummary } from "./revenue-dashboard.types";

function sid(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 29 + s.charCodeAt(i)) >>> 0;
  return `sug-${h.toString(16)}`;
}

export function buildAutoSuggestions(summary: RevenueDashboardSummary): AutoSuggestion[] {
  const out: AutoSuggestion[] = [];

  if (summary.leadUnlockRate > 0 && summary.leadUnlockRate < 0.1 && summary.leadsViewed >= 8) {
    out.push({
      id: sid("cta"),
      text: "CTA: shorten unlock friction — test clearer price + value line on lead detail",
    });
  }

  if (summary.bnhub.weekBookingFeeRevenue <= 0 && summary.bookingStarts >= 2) {
    out.push({
      id: sid("price"),
      text: "Pricing: verify guest-facing total matches expected booking fee capture",
    });
  }

  if (summary.revenueBySource.boost <= 0 && summary.activeBrokers >= 5) {
    out.push({
      id: sid("listing"),
      text: "Listings: promote featured slots to brokers with live inventory",
    });
  }

  return out.slice(0, 4);
}
