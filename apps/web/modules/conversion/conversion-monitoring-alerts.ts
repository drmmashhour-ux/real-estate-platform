import type { ConversionMonitoringState } from "@/modules/conversion/conversion-monitoring.service";

export type ConversionMonitoringAlertLevel = "warn";

export type ConversionMonitoringAlert = {
  level: ConversionMonitoringAlertLevel;
  code: string;
  message: string;
};

/**
 * Heuristic alerts on in-process counters (best-effort; same limitations as the counters).
 */
export function computeConversionMonitoringAlerts(snapshot: ConversionMonitoringState): ConversionMonitoringAlert[] {
  const alerts: ConversionMonitoringAlert[] = [];

  const surfaceTraffic = Object.values(snapshot.surfaceViewsByKey).reduce((a, n) => a + n, 0);
  const engaged = snapshot.leadFormStarts > 0 || surfaceTraffic >= 2;

  if (engaged && snapshot.leadSubmits === 0 && snapshot.leadFormStarts >= 1) {
    alerts.push({
      level: "warn",
      code: "lead_submit_zero_with_engagement",
      message:
        "leadSubmits is 0 while form starts or surface traffic exist — verify successful POST handlers and HTTP 200.",
    });
  }

  if (snapshot.leadFormStarts >= 5 && snapshot.leadSubmits === 0) {
    alerts.push({
      level: "warn",
      code: "high_start_vs_submit_gap",
      message:
        "leadFormStarts is much higher than leadSubmits — possible validation friction, abandonment, or broken submit path.",
    });
  }

  const ctaSum =
    snapshot.listingCtaClicks + snapshot.propertyCtaClicks + snapshot.brokerPreviewCtaClicks;

  if (surfaceTraffic >= 10 && ctaSum === 0 && snapshot.leadFormStarts >= 3) {
    alerts.push({
      level: "warn",
      code: "cta_zero_with_traffic",
      message:
        "No listing/property/broker preview CTA clicks recorded despite sustained traffic — check rollout wiring or guards blocking events.",
    });
  }

  return alerts;
}
