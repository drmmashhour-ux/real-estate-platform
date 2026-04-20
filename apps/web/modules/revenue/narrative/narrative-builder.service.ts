import type {
  NarrativeFact,
  NarrativeMetricsSlice,
  NarrativeOpportunity,
  NarrativeRisk,
  NarrativeSummary,
} from "./narrative.types";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  percentChange,
  trendDirection,
} from "./narrative-math";

export type NarrativeBuilderInput = {
  current: NarrativeMetricsSlice;
  previous: NarrativeMetricsSlice | null;
  listingCount?: number;
  pricingAppliedCount?: number;
  /** ISO 4217 for fact line currency display. */
  currencyCode?: string;
};

export function buildRevenueNarrative(input: NarrativeBuilderInput): NarrativeSummary {
  const { current, previous, listingCount, pricingAppliedCount } = input;
  const cc = input.currencyCode?.length === 3 ? input.currencyCode : "CAD";

  const revenueDelta = previous ? percentChange(current.grossRevenue, previous.grossRevenue) : 0;
  const bookingDelta = previous ? percentChange(current.bookingCount, previous.bookingCount) : 0;
  const occupancyDelta = previous ? percentChange(current.occupancyRate, previous.occupancyRate) : 0;
  const adrDelta = previous ? percentChange(current.adr, previous.adr) : 0;
  const revparDelta = previous ? percentChange(current.revpar, previous.revpar) : 0;

  const facts: NarrativeFact[] = [
    {
      label: "Gross revenue",
      value: formatCurrency(current.grossRevenue, cc),
      direction: trendDirection(revenueDelta),
      explanation: previous
        ? `Changed ${formatPercent(revenueDelta)} versus the previous period (ratio of totals).`
        : "No previous comparison period stored or computed.",
    },
    {
      label: "Bookings",
      value: formatNumber(current.bookingCount),
      direction: trendDirection(bookingDelta),
      explanation: previous
        ? `Changed ${formatPercent(bookingDelta)} versus the previous period (ratio of counts).`
        : "No previous comparison period stored or computed.",
    },
    {
      label: "Occupancy",
      value: formatPercent(current.occupancyRate),
      direction: trendDirection(occupancyDelta),
      explanation: previous
        ? `Changed ${formatPercent(occupancyDelta)} versus the previous period (ratio of occupancy rates).`
        : "No previous comparison period stored or computed.",
    },
    {
      label: "ADR",
      value: formatCurrency(current.adr, cc),
      direction: trendDirection(adrDelta),
      explanation: previous
        ? `Changed ${formatPercent(adrDelta)} versus the previous period.`
        : "No previous comparison period stored or computed.",
    },
    {
      label: "RevPAR",
      value: formatCurrency(current.revpar, cc),
      direction: trendDirection(revparDelta),
      explanation: previous
        ? `Changed ${formatPercent(revparDelta)} versus the previous period.`
        : "No previous comparison period stored or computed.",
    },
  ];

  const risks: NarrativeRisk[] = [];
  const opportunities: NarrativeOpportunity[] = [];

  if (current.occupancyRate < 0.4) {
    risks.push({
      severity: "high",
      message:
        "Occupancy is below 40% on the occupancy definition used here (occupied nights ÷ modeled available nights).",
    });
  }

  if (current.revpar < current.adr * 0.45 && current.adr > 0) {
    risks.push({
      severity: "medium",
      message:
        "RevPAR is materially lower than ADR versus the proportional checkpoint used by this rule (RevPAR ÷ ADR).",
    });
  }

  if (previous && revenueDelta < -0.15) {
    risks.push({
      severity: "high",
      message:
        "Gross revenue declined materially versus the previous period on the comparison inputs available (threshold rule).",
    });
  }

  if (previous && bookingDelta < -0.15) {
    risks.push({
      severity: "medium",
      message:
        "Booking count fell materially versus the previous period on the comparison inputs available (threshold rule).",
    });
  }

  if (current.occupancyRate >= 0.7 && current.adr > 0) {
    opportunities.push({
      priority: "high",
      message:
        "High occupancy on this metric definition suggests capacity to test pricing on premium nights while monitoring utilization.",
    });
  }

  if (current.occupancyRate < 0.5 && current.adr > 0) {
    opportunities.push({
      priority: "high",
      message:
        "Lower occupancy on this metric definition suggests testing demand levers (pricing, promotions, distribution) with measured experiments.",
    });
  }

  if ((pricingAppliedCount || 0) > 0) {
    opportunities.push({
      priority: "medium",
      message: `Recorded ${pricingAppliedCount} successful pricing execution log entries — compare against booking and revenue deltas using the same windows.`,
    });
  }

  if ((listingCount || 0) >= 5) {
    opportunities.push({
      priority: "medium",
      message:
        "Multiple listings under the same definitions make relative benchmarking across listings more meaningful.",
    });
  }

  let headline = "Performance was stable in the current review period on the metrics shown.";
  if (previous) {
    if (revenueDelta > 0.1) {
      headline = "Gross revenue improved materially versus the prior comparison period on these inputs.";
    } else if (revenueDelta < -0.1) {
      headline = "Gross revenue softened materially versus the prior comparison period on these inputs.";
    }
  }

  const overviewParts = [
    `The portfolio generated ${formatCurrency(current.grossRevenue, cc)} in gross revenue (BNHub booking totals in range)`,
    `from ${formatNumber(current.bookingCount)} bookings`,
    `with occupancy at ${formatPercent(current.occupancyRate)}`,
    `ADR at ${formatCurrency(current.adr, cc)}`,
    `and RevPAR at ${formatCurrency(current.revpar, cc)}.`,
  ];

  if (previous) {
    overviewParts.push(
      `Compared with the previous period inputs, gross revenue moved ${revenueDelta >= 0 ? "up" : "down"} by ${formatPercent(revenueDelta)} and bookings moved ${bookingDelta >= 0 ? "up" : "down"} by ${formatPercent(bookingDelta)} (ratio-based change).`
    );
  }

  const closing =
    risks.length > 0
      ? "Prioritize verifying data inputs (date windows, booking statuses) before acting on rules-based signals; address highest-severity items first."
      : "No major rule-based warning fired on these inputs; continue monitoring with the same deterministic definitions.";

  return {
    headline,
    overview: overviewParts.join(" "),
    facts,
    risks,
    opportunities,
    closing,
  };
}
