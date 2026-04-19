/**
 * Deterministic string assembly from `InvestorNarrativeInput` — no LLM, no guarantees, no invented numbers.
 */

import type { InvestorNarrative } from "@/modules/investors/investor-dashboard.types";
import type { InvestorNarrativeInput } from "@/modules/investors/investor-metrics.service";

function leadDeltaText(n: InvestorNarrativeInput): string {
  const d = n.leadsCur - n.leadsPrev;
  if (d > 0) return `New lead intake is up by ${d} versus the prior ${n.windowDays}-day window.`;
  if (d < 0) return `New lead intake is down by ${Math.abs(d)} versus the prior ${n.windowDays}-day window.`;
  return `New lead intake is flat versus the prior ${n.windowDays}-day window.`;
}

function wonDeltaText(n: InvestorNarrativeInput): string {
  const d = n.dealsWonCur - n.dealsWonPrev;
  if (d > 0) return `Closed-won updates in CRM increased by ${d} (windowed on last update time).`;
  if (d < 0) return `Closed-won updates in CRM decreased by ${Math.abs(d)}.`;
  return "Closed-won updates in CRM are unchanged in this short window.";
}

export function buildInvestorNarrative(n: InvestorNarrativeInput): InvestorNarrative {
  const growthStory: string[] = [leadDeltaText(n)];
  if (n.qualifiedPct != null) {
    growthStory.push(
      `Approximately ${(n.qualifiedPct * 100).toFixed(1)}% of new leads in the window reached qualified stage or better (rule-based pipeline fields).`,
    );
  } else {
    growthStory.push("Qualified share is not shown — pipeline stage data in the window was too thin to state a rate.");
  }
  if (!n.revenueInsufficient && n.revenueCentralCad != null && n.revenueBandLabel) {
    growthStory.push(
      `Illustrative CRM-based revenue band centers near ${n.revenueCentralCad.toLocaleString()} CAD with bounded conservative/optimistic variants (${n.forecastConfidence ?? "low"} confidence).`,
    );
  }
  if (n.sparseBundle) {
    growthStory.push(
      "Several headline metrics carry low confidence — describe traction directionally until logging density improves.",
    );
  }

  const executionProof: string[] = [];
  executionProof.push(wonDeltaText(n));
  if (n.scaleLeadDelta != null && n.scaleLeadBand) {
    executionProof.push(
      `Scale-system comparison registers lead delta ${n.scaleLeadDelta >= 0 ? "+" : ""}${n.scaleLeadDelta} vs prior window (${n.scaleLeadBand} band — correlational).`,
    );
  }
  if (n.aiSparseTelemetry) {
    executionProof.push(
      "AI execution assistance telemetry is sparse — measured adoption of drafts remains thin for this window.",
    );
  } else if (!n.sparseBundle) {
    executionProof.push("AI assist telemetry shows non-zero engagement in this window (panel interactions / events).");
  }
  if (n.brokerInsufficientUniform) {
    executionProof.push(
      "Broker monetization proxy rows are uniformly thin — treat broker-tier signals as exploratory.",
    );
  }

  const expansionStory: string[] = [];
  if (n.topCity && n.weakestCity && n.topCity !== n.weakestCity) {
    expansionStory.push(
      `Fast Deal bundle ranks ${n.topCity} ahead of ${n.weakestCity} on the internal scorecard — scoring is heuristic, not market share.`,
    );
  } else if (n.topCity) {
    expansionStory.push(`Fast Deal bundle highlights ${n.topCity} at the top of the configured comparison set.`);
  } else {
    expansionStory.push("City comparison bundle was unavailable — geographic expansion narrative relies on CRM intake cities only.");
  }
  if (n.expansionSnippet) expansionStory.push(n.expansionSnippet);
  for (const line of n.comparisonInsightLines.slice(0, 2)) {
    if (!expansionStory.some((e) => e === line)) expansionStory.push(line);
  }

  const risks: string[] = [];
  if (n.revenueInsufficient) {
    risks.push("Illustrative revenue range withheld — insufficient CRM counts or deal-value coverage for a bounded estimate.");
  }
  if (n.aiSparseTelemetry) risks.push("Low AI-assist engagement telemetry may understate actual manual work outside the platform.");
  if (n.brokerInsufficientUniform) risks.push("Broker competition signals are thin — do not infer partner quality from tiers alone.");
  if (n.sparseBundle) risks.push("Aggregate metric confidence is mixed — external storytelling should cite ranges and gaps explicitly.");
  if (n.leadsCur < 8) risks.push("Lead intake volume in the window is low — short-window ratios may swing without operational meaning.");
  risks.push("Past pipeline movements do not predict future closes — execution and market factors dominate.");

  const outlook: string[] = [];
  if (n.leadsCur >= n.leadsPrev && n.dealsWonCur >= n.dealsWonPrev) {
    outlook.push(
      "Near-term operating focus: sustain intake while validating qualification quality — monitor next window for confirmation.",
    );
  } else {
    outlook.push(
      "Near-term operating focus: stabilize intake and qualification before emphasizing expansion narratives.",
    );
  }
  outlook.push(
    "Forward outlook here is qualitative — numeric scenarios remain tied to CRM density and governance; no growth guarantee is implied.",
  );

  let headline = "Measured operating activity with mixed confidence layers";
  if (!n.sparseBundle && n.leadsCur > n.leadsPrev && (n.qualifiedPct ?? 0) >= 0.25) {
    headline = "Lead flow improving with observable pipeline depth";
  } else if (n.sparseBundle) {
    headline = "Early signals with limited logging depth — emphasize ranges, not headlines";
  }

  const summary = [
    `Reporting window: ${n.windowDays} days. `,
    `Leads captured: ${n.leadsCur} (prior window ${n.leadsPrev}). `,
    `Closed-won CRM updates in window: ${n.dealsWonCur}. `,
    n.revenueInsufficient
      ? "Revenue illustration withheld pending denser CRM outcomes. "
      : n.revenueCentralCad != null
        ? `Illustrative revenue center ~${n.revenueCentralCad.toLocaleString()} CAD (${n.forecastConfidence ?? "low"} confidence scenario). `
        : "",
    "All statements derive from stored events and rules — review with finance before investor distribution.",
  ].join("");

  return {
    headline,
    summary: summary.trim(),
    growthStory,
    executionProof,
    expansionStory,
    risks,
    outlook,
  };
}
