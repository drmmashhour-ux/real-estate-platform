import type { CompanyMetricsSnapshot } from "./company-outcome-aggregator.service";
import type { CompanyStrategyDomain } from "@prisma/client";
import { COMPANY_AI_BOUNDS, confidenceAfterSampleAdjust } from "./company-ai-bounds";

export type DetectedPattern = {
  id: string;
  statement: string;
  confidence: number;
  domains: CompanyStrategyDomain[];
  suggestedAdaptation: {
    type: string;
    summary: string;
    expectedEffect: string;
  };
  evidence: Record<string, unknown>;
};

function sampleSize(m: CompanyMetricsSnapshot): number {
  return m.deals.sample + m.bookings.sample;
}

/**
 * Deterministic pattern detector over aggregated metrics (explicit, auditable rules).
 * Replace / extend with ML later — outputs remain bounded and logged.
 */
export function detectCompanyPatterns(latest: CompanyMetricsSnapshot | null): DetectedPattern[] {
  if (!latest) return [];
  const s = sampleSize(latest);
  const patterns: DetectedPattern[] = [];

  if (latest.deals.sample >= COMPANY_AI_BOUNDS.minSampleWeakPattern && latest.deals.closeRate >= 0.25) {
    const conf = confidenceAfterSampleAdjust(0.72, s);
    if (conf > 0.05) {
      patterns.push({
        id: "deals_health_positive",
        statement: "Residential deal flow shows healthy close rate vs new deal intake in this window.",
        confidence: conf,
        domains: ["DEALS", "EXECUTION"],
        suggestedAdaptation: {
          type: "PRIORITY_SHIFT",
          summary: "Slightly increase opportunity-ranking weight on segments mirroring recent winners.",
          expectedEffect: "More pipeline focus on proven close paths without changing binding rules.",
        },
        evidence: { closeRate: latest.deals.closeRate, dealsSample: latest.deals.sample },
      });
    }
  }

  if (latest.bookings.sample >= COMPANY_AI_BOUNDS.minSampleWeakPattern && latest.bookings.conversionToConfirmed < 0.3) {
    const conf = confidenceAfterSampleAdjust(0.68, s);
    if (conf > 0.05) {
      patterns.push({
        id: "bnhub_conversion_soft",
        statement: "BNHub-style bookings show soft confirmation conversion — host approval or checkout friction likely.",
        confidence: conf,
        domains: ["MARKETPLACE", "GROWTH"],
        suggestedAdaptation: {
          type: "EXPERIMENT_RECOMMENDATION",
          summary: "Run structured experiment on reminder timing and host SLA nudges (recommendation-only).",
          expectedEffect: "Higher confirmed stays without auto-approving guests.",
        },
        evidence: {
          conversionToConfirmed: latest.bookings.conversionToConfirmed,
          bookingSample: latest.bookings.sample,
        },
      });
    }
  }

  if (latest.deals.sample >= COMPANY_AI_BOUNDS.minSampleWeakPattern && latest.deals.closeRate < 0.12) {
    const conf = confidenceAfterSampleAdjust(0.74, s);
    if (conf > 0.05) {
      patterns.push({
        id: "deal_friction_high",
        statement: "Deal close rate is depressed vs intake — negotiation or approval latency may be consuming yield.",
        confidence: conf,
        domains: ["DEALS", "EXECUTION", "FINANCE"],
        suggestedAdaptation: {
          type: "RISK_TIGHTENING",
          summary: "Tighten scoring threshold for high-touch opportunities until execution latency improves (human-approved).",
          expectedEffect: "Reduce low-return work in the execution queue.",
        },
        evidence: { closeRate: latest.deals.closeRate, cancelled: latest.deals.cancelled },
      });
    }
  }

  if (latest.investors.memoRows > 2 && latest.investors.icPackRows < latest.investors.memoRows * 0.5) {
    const conf = confidenceAfterSampleAdjust(0.55, Math.max(s, latest.investors.memoRows * 3));
    if (conf > 0.05) {
      patterns.push({
        id: "investor_packaging_gap",
        statement: "Investor memo throughput exceeds IC pack pairing — institutional packaging may be inconsistent.",
        confidence: conf,
        domains: ["INVESTMENT", "EXECUTION"],
        suggestedAdaptation: {
          type: "PRIORITY_SHIFT",
          summary: "Emphasize IC pack completion in investor workflow recommendations.",
          expectedEffect: "Higher quality downstream committee submissions.",
        },
        evidence: { memos: latest.investors.memoRows, icPacks: latest.investors.icPackRows },
      });
    }
  }

  if (latest.compliance.openAlerts > 15) {
    patterns.push({
      id: "compliance_queue_pressure",
      statement: "Open compliance escalations are elevated — strategic initiatives may face approval drag.",
      confidence: confidenceAfterSampleAdjust(0.62, Math.max(s, latest.compliance.openAlerts)),
      domains: ["EXECUTION", "FINANCE"],
      suggestedAdaptation: {
        type: "RESOURCE_REALLOCATION",
        summary: "Temporarily bias task prioritization toward compliance resolution (recommendation to ops).",
        expectedEffect: "Faster unblock of broker-facing flows; no automatic legal disposition.",
      },
      evidence: { openAlerts: latest.compliance.openAlerts },
    });
  }

  return patterns.sort((a, b) => b.confidence - a.confidence);
}
