import type { BookingFunnelAnalysis } from "@/modules/growth/booking-funnel-analysis.service";

/** Automated playbook strings for dashboard + ops (deterministic from funnel analysis). */
export function buildAutomatedCroRecommendations(f: BookingFunnelAnalysis): string[] {
  const out: string[] = [];
  const { croEngineHints } = f;

  if (croEngineHints.dominantIssue === "listing_page") {
    out.push("Improve property page trust — add verification, Stripe reassurance, and clearer total price.");
    out.push("Add urgency only from real view/booking signals; test primary CTA copy.");
  }
  if (croEngineHints.dominantIssue === "checkout_trust") {
    out.push("Reduce checkout friction — confirm steps are obvious and fees are visible before pay.");
    out.push("Surface secure checkout + no hidden fees; review payment-step drop-off.");
  }
  if (croEngineHints.dominantIssue === "landing_to_listing") {
    out.push("Improve listing discovery — strengthen preview cards and search→detail CTR.");
  }
  if (croEngineHints.dominantIssue === "none" && f.bottleneck === "traffic") {
    out.push("Top-of-funnel is thin — CRO gains need more qualified visits first.");
  }
  if (out.length === 0) {
    out.push(f.recommendation);
  }
  return [...new Set(out)];
}
