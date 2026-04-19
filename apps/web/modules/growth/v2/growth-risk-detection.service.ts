/**
 * Conservative risk hypotheses — deterministic from inputs only.
 */

import type { BookingFunnelAnalysis } from "@/modules/growth/booking-funnel-analysis.service";
import type { GrowthRisk, GrowthSeverity } from "./growth-engine-v2.types";
import type { OpportunitySignalPack } from "./growth-opportunity-detection.service";

function risk(
  id: string,
  category: GrowthRisk["category"],
  title: string,
  description: string,
  severity: GrowthSeverity,
  recommendedResponse: string,
  sourceSignals: string[],
): GrowthRisk {
  return { id, category, title, description, severity, recommendedResponse, sourceSignals };
}

export function detectGrowthRisks(pack: OpportunitySignalPack): GrowthRisk[] {
  const out: GrowthRisk[] = [];

  const platform = pack.platform;
  if (platform && platform.totals.visitors < 120) {
    out.push(
      risk(
        "risk-low-traffic",
        "traffic",
        "Traffic sample is thin",
        `Visitors ~${platform.totals.visitors} in window — downstream metrics swing easily.`,
        "medium",
        "Treat conversion reads cautiously; confirm tracking coverage before large bets.",
        [`visitors=${platform.totals.visitors}`],
      ),
    );
  }

  const funnel: BookingFunnelAnalysis | null = pack.funnel;
  if (funnel && funnel.counts.bookingStarted >= 6 && funnel.counts.bookingCompleted === 0) {
    out.push(
      risk(
        "risk-bnhub-completion",
        "bnhub",
        "Booking completion empty in window",
        "Bookings started without completes — verify payments + confirmation paths.",
        "high",
        "Manual QA on checkout; no auto-charges or retries from this layer.",
        [`booking_started=${funnel.counts.bookingStarted}`, `booking_completed=0`],
      ),
    );
  }

  if (pack.followUpDebtRatio != null && pack.followUpDebtRatio >= 0.45) {
    out.push(
      risk(
        "risk-followup-debt",
        "broker",
        "Follow-up debt likely elevated",
        "High contacted-share on sample — pipeline may stall without cadence fixes.",
        "medium",
        "Broker enablement + CRM hygiene review (read-only diagnostics).",
        [`contacted_share_heuristic=${pack.followUpDebtRatio.toFixed(2)}`],
      ),
    );
  }

  const b = pack.broker;
  if (b?.sparse) {
    out.push(
      risk(
        "risk-sparse-broker-signals",
        "broker",
        "Sparse broker performance sample",
        "Too few brokers or too many insufficient-data bands — cohort reads unstable.",
        "low",
        "Defer broker-wide decisions until sample firms up.",
        [`brokersSampled=${b.brokersSampled}`, `insufficientDataShare=${(b.insufficientDataShare ?? 0).toFixed(2)}`],
      ),
    );
  }

  if (platform && platform.totals.listingsTotal > 0 && platform.totals.transactionsClosed === 0) {
    out.push(
      risk(
        "risk-revenue-inactive",
        "revenue",
        "Closed transactions absent in window",
        "Listings exist but no closed-booking signal in stats window — verify revenue ops visibility.",
        "medium",
        "Confirm finance dashboards + booking completion telemetry.",
        [`listingsTotal=${platform.totals.listingsTotal}`, `transactionsClosed=0`],
      ),
    );
  }

  out.sort((a, b) => {
    const sev = (s: GrowthSeverity) => (s === "high" ? 0 : s === "medium" ? 1 : 2);
    if (sev(a.severity) !== sev(b.severity)) return sev(a.severity) - sev(b.severity);
    return a.id.localeCompare(b.id);
  });

  return out.slice(0, 12);
}
