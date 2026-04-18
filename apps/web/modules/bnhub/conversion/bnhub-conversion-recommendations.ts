import type { BNHubConversionInsight } from "./bnhub-guest-conversion.types";

const MAX = 3;

/**
 * Deterministic top-N advisory strings from insight types (no auto-execution).
 */
export function buildTopBnhubConversionRecommendations(insights: BNHubConversionInsight[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (s: string) => {
    if (out.length >= MAX) return;
    if (seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };

  for (const ins of insights) {
    switch (ins.type) {
      case "low_ctr":
        push("Improve lead photo and title so the card stands out in search results (advisory).");
        push("Align the headline with what guests filter for in this market.");
        break;
      case "low_view_rate":
        push("Reduce mismatch between search snippet and listing hero — clarify amenities and location.");
        break;
      case "low_booking_rate":
        push("Review calendar, minimum nights, and total price clarity before checkout.");
        push("Strengthen trust signals (reviews, verification) on the listing page.");
        break;
      case "low_booking_start_rate":
        push("Put total price (nights × rate + fees) near the primary book button.");
        push("Confirm instant-book eligibility and calendar blocks are obvious before guests tap book.");
        break;
      case "friction_detected":
        push("Walk the booking flow as a guest and note where drop-off happens before payment.");
        break;
      case "strong_performance":
        push("Keep monitoring seasonality; consider light tests on hero copy only when ready.");
        break;
      default:
        break;
    }
  }

  if (out.length === 0) {
    push("Continue monitoring funnel metrics weekly; keep listing photos and description current.");
  }

  return out.slice(0, MAX);
}
