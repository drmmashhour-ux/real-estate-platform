import type { FunnelLeak } from "./funnel-analysis.service";

export type FunnelFix = {
  stage: string;
  severity: string;
  actions: string[];
};

export function generateFixes(leaks: FunnelLeak[]): FunnelFix[] {
  return leaks.map((leak) => {
    switch (leak.stage) {
      case "CTR":
        return {
          stage: "CTR",
          severity: leak.severity,
          actions: [
            "Improve ad creatives (hook, headline)",
            "Add stronger value proposition",
            "Test new thumbnails/images",
            "Align ad with landing page intent",
          ],
        };

      case "CLICK_TO_LEAD":
        return {
          stage: "CLICK_TO_LEAD",
          severity: leak.severity,
          actions: [
            "Reduce form friction",
            "Add trust badges",
            "Add testimonials/social proof",
            "Improve landing clarity",
          ],
        };

      case "LEAD_TO_BOOKING":
        return {
          stage: "LEAD_TO_BOOKING",
          severity: leak.severity,
          actions: [
            "Add urgency (limited availability)",
            "Send retargeting emails/SMS",
            "Offer discount incentive",
            "Improve booking UX",
          ],
        };

      case "COMPLETION":
        return {
          stage: "COMPLETION",
          severity: leak.severity,
          actions: [
            "Fix payment friction",
            "Enable guest checkout",
            "Show total price early",
            "Reduce steps in checkout",
          ],
        };

      default:
        return {
          stage: String(leak.stage),
          severity: leak.severity,
          actions: ["No recommendation"],
        };
    }
  });
}
