import type { BNHubConversionInsight, BNHubConversionMetrics } from "./bnhub-guest-conversion.types";
import { recordBnhubAnalyzerRun, recordBnhubInsightsGenerated } from "./bnhub-conversion-monitoring.service";

const CTR_LOW = 0.08;
const VIEW_RATE_LOW = 0.35;
const BOOKING_RATE_LOW = 0.02;
const VIEW_TO_START_LOW = 0.055;
const CTR_STRONG = 0.18;
const VIEW_RATE_STRONG = 0.55;
const BOOKING_RATE_STRONG = 0.08;

let idSeq = 0;
function nextId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${idSeq}`;
}

/**
 * Deterministic insight generation from funnel metrics — no side effects on inputs.
 */
export function analyzeBNHubConversion(metrics: BNHubConversionMetrics): BNHubConversionInsight[] {
  recordBnhubAnalyzerRun();
  const out: BNHubConversionInsight[] = [];

  const {
    impressions,
    clicks,
    views,
    bookingStarts,
    bookingsCompleted,
    ctr,
    viewRate,
    bookingRate,
    viewToStartRate,
  } = metrics;

  if (impressions >= 20 && ctr < CTR_LOW) {
    out.push({
      id: nextId("ctr"),
      type: "low_ctr",
      title: "Discovery CTR is below typical",
      description:
        "Clicks are low relative to impressions — guests may not be selecting this listing from search or map surfaces.",
      severity: ctr < CTR_LOW / 2 ? "high" : "medium",
    });
  }

  if (clicks >= 10 && viewRate < VIEW_RATE_LOW) {
    out.push({
      id: nextId("vr"),
      type: "low_view_rate",
      title: "Listing views lag behind clicks",
      description:
        "Some discovery clicks may not be turning into listing page views — check deep links and mobile navigation.",
      severity: viewRate < VIEW_RATE_LOW / 2 ? "high" : "medium",
    });
  }

  if (views >= 15 && viewToStartRate < VIEW_TO_START_LOW) {
    out.push({
      id: nextId("vs"),
      type: "low_booking_start_rate",
      title: "Low booking start rate vs listing views",
      description:
        "Guests open the listing but rarely start a booking — strengthen price clarity, trust chips, and minimum-night expectations above the fold.",
      severity: viewToStartRate < VIEW_TO_START_LOW / 2 ? "high" : "medium",
    });
  }

  if (views >= 15 && bookingRate < BOOKING_RATE_LOW) {
    out.push({
      id: nextId("br"),
      type: "low_booking_rate",
      title: "Few completed bookings vs views",
      description:
        "Views are present but paid completions are low — review calendar, price clarity, and checkout eligibility.",
      severity: bookingStarts >= 5 ? "high" : "medium",
    });
  }

  if (
    impressions >= 15 &&
    ctr >= CTR_STRONG &&
    viewRate >= VIEW_RATE_STRONG &&
    bookingRate >= BOOKING_RATE_STRONG
  ) {
    out.push({
      id: nextId("ok"),
      type: "strong_performance",
      title: "Strong guest funnel signals",
      description: "CTR, view depth, and booking rate are healthy for this window — keep monitoring seasonality.",
      severity: "low",
    });
  }

  recordBnhubInsightsGenerated(out.length);
  return out;
}
