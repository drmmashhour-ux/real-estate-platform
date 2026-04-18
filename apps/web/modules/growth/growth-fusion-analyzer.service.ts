/**
 * Deterministic cross-source fusion analysis — no LLM, no side effects.
 */

import { computePriorityScore } from "@/modules/growth/ai-autopilot.service";
import type { AiAutopilotImpact } from "@/modules/growth/ai-autopilot.types";
import type { GrowthFusionRawSnapshot } from "./growth-fusion-snapshot.service";
import type { GrowthFusionSignal, GrowthFusionSummary, GrowthFusionSummaryStatus } from "./growth-fusion.types";

function push(
  grouped: GrowthFusionSummary["grouped"],
  sig: GrowthFusionSignal,
): void {
  grouped[sig.source === "leads" ? "leads" : sig.source === "ads" ? "ads" : sig.source === "cro" ? "cro" : sig.source === "content" ? "content" : "autopilot"].push(sig);
}

function sig(
  source: GrowthFusionSignal["source"],
  id: string,
  type: string,
  title: string,
  description: string,
  impact: GrowthFusionSignal["impact"],
  confidence: number,
  metadata?: Record<string, unknown>,
): GrowthFusionSignal {
  const imp = impact as AiAutopilotImpact;
  const ps = computePriorityScore(imp, confidence, "medium");
  return {
    source,
    id,
    type,
    title,
    description,
    impact,
    confidence,
    priorityScore: ps,
    metadata,
  };
}

export function analyzeGrowthFusion(snapshot: GrowthFusionRawSnapshot): GrowthFusionSummary {
  const grouped: GrowthFusionSummary["grouped"] = {
    leads: [],
    ads: [],
    cro: [],
    content: [],
    autopilot: [],
  };
  const signals: GrowthFusionSignal[] = [];

  const { totalCount: lt, recent7dCount: lr } = snapshot.leads;
  if (lr === 0 && lt > 5) {
    const s = sig(
      "leads",
      "fuse-leads-stale",
      "velocity",
      "Recent lead velocity is flat",
      "No new CRM leads in the last 7 days while historical pipeline exists — review capture sources.",
      "medium",
      0.55,
      { recent7d: lr, total: lt },
    );
    signals.push(s);
    push(grouped, s);
  }

  const ads = snapshot.ads.summary;
  const imp = ads?.impressions ?? 0;
  const clk = ads?.clicks ?? 0;
  const ld = ads?.leads ?? 0;
  const ctr = imp > 0 ? clk / imp : 0;
  const conv = ads?.conversionRatePercent;

  if (imp > 50 && ld < 2 && clk > 10) {
    const s = sig(
      "ads",
      "fuse-ads-traffic-no-leads",
      "efficiency",
      "Traffic without sufficient leads",
      "Clicks and views exist but lead capture is weak — conversion or offer mismatch before scaling spend.",
      "high",
      0.62,
      { impressions: imp, leads: ld, clicks: clk },
    );
    signals.push(s);
    push(grouped, s);
  }

  if (conv != null && conv < 1.5 && imp > 30) {
    const s = sig(
      "cro",
      "fuse-cro-conv",
      "funnel",
      "Landing conversion under pressure",
      `View→lead rate is about ${conv}% — improve CTA clarity and form friction before adding traffic.`,
      "high",
      0.6,
      { conversionRatePercent: conv },
    );
    signals.push(s);
    push(grouped, s);
  }

  if (ctr < 0.02 && imp > 40) {
    const s = sig(
      "cro",
      "fuse-cro-ctr",
      "creative",
      "CTR is thin vs impressions",
      "Creative or placement may not match intent — test headlines before budget changes.",
      "medium",
      0.52,
      { ctrApprox: ctr },
    );
    signals.push(s);
    push(grouped, s);
  }

  const cro = snapshot.cro;
  if (cro && cro.healthScore < 55) {
    const s = sig(
      "cro",
      "fuse-cro-health",
      "health",
      "CRO health score is weak",
      `Aggregate funnel health ~${cro.healthScore} — prioritize drop-off fixes visible in CRO V8 analysis.`,
      "high",
      0.58,
      { healthScore: cro.healthScore },
    );
    signals.push(s);
    push(grouped, s);
  }

  const { adDrafts, listingDrafts, outreachDrafts, skippedReason } = snapshot.content;
  const contentTotal = adDrafts + listingDrafts + outreachDrafts;
  if (contentTotal === 0 && !skippedReason) {
    const s = sig(
      "content",
      "fuse-content-gap",
      "coverage",
      "No content drafts available",
      "Enable content assist flags to generate ad/listing/outreach drafts aligned with campaigns.",
      "low",
      0.45,
    );
    signals.push(s);
    push(grouped, s);
  }

  for (const a of snapshot.autopilot.actions.slice(0, 5)) {
    const s = sig(
      "autopilot",
      `fuse-ap-${a.id}`,
      "autopilot",
      a.title,
      a.description,
      a.impact,
      a.confidence,
      { autopilotId: a.id, priorityScore: a.priorityScore },
    );
    signals.push(s);
    push(grouped, s);
  }

  for (const inf of snapshot.influence.suggestions) {
    const src = inf.target === "ads_strategy" ? "ads" : "cro";
    const s: GrowthFusionSignal = {
      source: src,
      id: `fuse-inf-${inf.id}`,
      type: "influence",
      title: inf.title,
      description: inf.description,
      impact: inf.impact,
      confidence: inf.confidence,
      priorityScore: inf.priorityScore,
      metadata: { influenceId: inf.id },
    };
    signals.push(s);
    push(grouped, s);
  }

  const topProblems: string[] = [];
  const topOpportunities: string[] = [];
  const topActions: string[] = [];

  if (imp > 50 && ld < 3) topProblems.push("Acquisition: traffic present but weak lead capture");
  if (conv != null && conv < 2) topProblems.push("Conversion: view→lead efficiency is low");
  if (lr === 0 && lt > 0) topProblems.push("Leads: no fresh leads in 7 days");
  if (lr < 3 && imp > 80 && ld < 2) {
    topProblems.push("Cross: thin recent CRM leads despite ad impressions — acquisition or attribution gap");
  }
  if (ld >= 3 && conv != null && conv < 1.5) {
    topProblems.push("Cross: leads exist but view→lead conversion is thin — CRO vs traffic quality");
  }
  if (lr >= 8 && snapshot.autopilot.actions.length === 0) {
    topProblems.push("Cross: healthy lead intake but empty autopilot queue — execution planning gap");
  }

  if (ld >= 5 && (conv == null || conv >= 2)) topOpportunities.push("Solid lead flow — consider cautious scale on winning creative");
  if (cro && cro.healthScore >= 70) topOpportunities.push("CRO fundamentals healthy — iterate experiments, not firefighting");

  if (imp > 30 && conv != null && conv < 2) {
    topActions.push("Improve landing CTA before scaling ads");
  }
  if (lr === 0 && lt > 10) {
    topActions.push("Prioritize top-of-funnel capture (forms, sources)");
  }
  if (contentTotal > 0) {
    topActions.push("Use Content Studio drafts to align messaging with funnel stage");
  }
  if (contentTotal === 0 && !skippedReason && ld >= 2) {
    topOpportunities.push("Demand signal without drafts — generate copy for campaigns and follow-up");
  }

  let status: GrowthFusionSummaryStatus = "moderate";
  let confidence = 0.55;
  if (snapshot.warnings.length >= 3) {
    status = "weak";
    confidence = 0.38;
  } else if (topProblems.length >= 3 || (conv != null && conv < 1)) {
    status = "weak";
    confidence = 0.48;
  } else if (topProblems.length === 0 && (ld >= 3 || (cro && cro.healthScore >= 65))) {
    status = "strong";
    confidence = 0.72;
  }

  return {
    status,
    topProblems: topProblems.slice(0, 3),
    topOpportunities: topOpportunities.slice(0, 3),
    topActions: topActions.slice(0, 3),
    confidence,
    signals,
    grouped,
    createdAt: snapshot.createdAt,
  };
}
