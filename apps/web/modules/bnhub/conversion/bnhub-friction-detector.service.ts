import type { BNHubConversionInsight, BNHubConversionMetrics } from "./bnhub-guest-conversion.types";
import { recordBnhubFrictionDetected } from "./bnhub-conversion-monitoring.service";

/**
 * Advisory friction hints when booking starts exist but completions are disproportionately low.
 */
export function detectBNHubFriction(metrics: BNHubConversionMetrics): BNHubConversionInsight[] {
  const { bookingStarts, bookingsCompleted, views } = metrics;
  const out: BNHubConversionInsight[] = [];

  if (bookingStarts >= 5 && bookingsCompleted === 0 && views >= 10) {
    recordBnhubFrictionDetected({ kind: "starts_no_completion" });
    out.push({
      id: "friction-starts-no-paid",
      type: "friction_detected",
      title: "Booking starts without paid completions",
      description:
        "Guests reached checkout starts but no completed payments in-window — review Stripe host readiness, calendar blocks, and guest drop-off before pay.",
      severity: "high",
    });
  }

  if (bookingStarts >= 8 && bookingsCompleted > 0) {
    const ratio = bookingsCompleted / bookingStarts;
    if (ratio < 0.15) {
      recordBnhubFrictionDetected({ kind: "low_completion_ratio" });
      out.push({
        id: "friction-low-completion-ratio",
        type: "friction_detected",
        title: "High checkout abandonment vs starts",
        description:
          "Many booking attempts relative to completions — confirm pricing breakdown and payout setup are visible before pay.",
        severity: "medium",
      });
    }
  }

  return out;
}
