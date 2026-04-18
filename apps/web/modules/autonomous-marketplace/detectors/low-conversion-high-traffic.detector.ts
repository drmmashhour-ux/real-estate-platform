import { autonomyConfig } from "../config/autonomy.config";
import type { ObservationSnapshot } from "../types/domain.types";
import { makeOpportunity, makeProposedAction } from "./detector-utils";
import type { AutonomyDetector } from "./detector.types";

export const lowConversionHighTrafficDetector: AutonomyDetector = {
  id: "low_conversion_high_traffic",
  description: "High listing views with weak conversion — improve copy or pricing narrative.",
  run(obs: ObservationSnapshot) {
    const out = [];
    if (obs.target.type !== "fsbo_listing" || !obs.target.id) return out;

    const views = obs.aggregates.views ?? 0;
    const conv = obs.signals.find((s) => s.signalType === "listing_performance");
    const rate =
      conv && conv.signalType === "listing_performance"
        ? (conv.metadata.conversionRate ?? 0)
        : views > 0
          ? (obs.aggregates.contacts ?? 0) / views
          : 0;

    if (views < autonomyConfig.detectors.lowConversionViewsThreshold) return out;
    if (rate >= autonomyConfig.detectors.lowConversionRate) return out;

    const pa = makeProposedAction({
      type: "UPDATE_LISTING_COPY",
      target: obs.target,
      detectorId: lowConversionHighTrafficDetector.id,
      opportunityId: "opp-lc-1",
      confidence: 0.72,
      risk: "MEDIUM",
      title: "Refresh listing copy for conversion",
      explanation: `Views (${views}) exceed threshold but conversion rate (${(rate * 100).toFixed(2)}%) is below target.`,
      humanReadableSummary:
        "Traffic is healthy; strengthen headline, benefits, and call-to-action so contacts match demand.",
      metadata: { views, conversionRate: rate },
    });
    const pa2 = makeProposedAction({
      type: "SUGGEST_PRICE_CHANGE",
      target: obs.target,
      detectorId: lowConversionHighTrafficDetector.id,
      opportunityId: "opp-lc-1",
      confidence: 0.55,
      risk: "MEDIUM",
      title: "Review price positioning",
      explanation: "Low conversion with high traffic may indicate price friction versus comps.",
      humanReadableSummary: "Generate an advisory price band review — no automatic price change.",
      metadata: { suggestDirection: "review_band" },
    });

    out.push(
      makeOpportunity({
        detectorId: lowConversionHighTrafficDetector.id,
        title: "Low conversion despite traffic",
        explanation: "Listing receives attention but weak downstream engagement.",
        confidence: 0.7,
        risk: "MEDIUM",
        evidence: { views, conversionRate: rate },
        actions: [pa, pa2],
      }),
    );
    return out;
  },
};
