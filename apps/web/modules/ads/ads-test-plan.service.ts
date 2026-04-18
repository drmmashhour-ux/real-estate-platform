/**
 * Next test plan — operator executes manually in Ads Manager; no auto-publish.
 */

import type { EvidenceQuality, GeoLearningSummary } from "./ads-automation-v4.types";
import type { CampaignClassificationWithEvidence } from "./ads-learning-classifier.service";
import type { CampaignAdsMetrics } from "./ads-performance.service";

export type TestPlanEnrichedRow = {
  label: string;
  rationale: string;
  evidenceQuality: EvidenceQuality;
  operatorAction: string;
  expectedOutcome?: string;
  blockers?: string[];
};

export type NextAdsTestPlan = {
  keepRunning: string[];
  pause: string[];
  duplicateAndScale: string[];
  newVariantsToTest: string[];
  audienceExperiments: string[];
  landingPageExperiments: string[];
  holdForMoreData: string[];
  rationaleNotes: string[];
  geoExperimentHints: string[];
  landingExperimentHints: string[];
  evidenceQualityOverall: EvidenceQuality;
  enrichedRows: TestPlanEnrichedRow[];
};

export function buildNextAdsTestPlan(input: {
  winners: CampaignAdsMetrics[];
  weak: CampaignAdsMetrics[];
  uncertain: CampaignAdsMetrics[];
  variantLabels: string[];
  evidence?: CampaignClassificationWithEvidence[];
  geoByCampaign?: Map<string, GeoLearningSummary>;
}): NextAdsTestPlan {
  const evMap = new Map((input.evidence ?? []).map((e) => [e.campaign.campaignKey, e]));

  const keepRunning = input.winners.map((w) => w.campaignKey);
  const pause = input.weak.map((w) => w.campaignKey);
  const duplicateAndScale = input.winners.slice(0, 2).map(
    (w) => `Duplicate ad set · ${w.campaignKey} · +10–20% budget only after manual review`,
  );

  const newVariantsToTest = [
    ...input.variantLabels,
    "A/B: first-line hook (question vs statement)",
    "A/B: CTA text only (keep URL identical)",
  ];

  const audienceExperiments = [
    ...input.uncertain.slice(0, 3).map((u) => `Hold ${u.campaignKey} — gather 3× more clicks before broadening audience`),
    "Split: Advantage+ broad vs interest stack (same creative)",
  ];

  const landingPageExperiments = [
    "Mirror headline variant A/B on landing H1 for message match",
    "If clicks strong but leads weak: shorten lead form fields (manual CMS change)",
  ];

  const holdForMoreData: string[] = [];
  for (const u of input.uncertain) {
    const ev = evMap.get(u.campaignKey);
    if (ev && ev.evidenceQuality === "LOW") {
      holdForMoreData.push(
        `${u.campaignKey}: hold scaling — evidence ${ev.evidenceQuality.toLowerCase()} (${(ev.evidenceScore * 100).toFixed(0)}%).`,
      );
    }
  }

  const geoExperimentHints: string[] = [];
  const g = input.geoByCampaign;
  if (g) {
    for (const w of input.winners.slice(0, 3)) {
      const geo = g.get(w.campaignKey);
      if (geo?.available && geo.slices.length >= 2) {
        geoExperimentHints.push(
          `${w.campaignKey}: test duplicate creative in ${geo.topSliceLabel ?? "top geo"} before reallocating budget.`,
        );
      }
    }
  }

  const landingExperimentHints = [...landingPageExperiments];

  const rationaleNotes = [
    "Plans are evidence-aware: low-reliability buckets stay in hold/experiment queues.",
    "All changes remain manual in Ads Manager and CMS.",
  ];

  const enrichedRows: TestPlanEnrichedRow[] = [];
  for (const w of input.winners.slice(0, 4)) {
    const ev = evMap.get(w.campaignKey);
    enrichedRows.push({
      label: `Keep ${w.campaignKey}`,
      rationale: ev
        ? `Winner bucket with evidence ${ev.evidenceQuality} — CTR ${w.ctrPercent ?? "—"}%.`
        : "Classified winner by platform thresholds.",
      evidenceQuality: ev?.evidenceQuality ?? "MEDIUM",
      operatorAction: "Monitor; duplicate only after manual review.",
      expectedOutcome: "Measure incremental leads/bookings without auto-scaling.",
    });
  }
  for (const x of input.weak.slice(0, 4)) {
    const ev = evMap.get(x.campaignKey);
    enrichedRows.push({
      label: `Review ${x.campaignKey}`,
      rationale: ev
        ? `Weak bucket — evidence ${ev.evidenceQuality}; confirm in ad network UI.`
        : "Weak by CTR/CPL rules.",
      evidenceQuality: ev?.evidenceQuality ?? "MEDIUM",
      operatorAction: "Pause or reduce in network UI if metrics agree; check attribution gaps.",
      blockers: ev?.evidenceQuality === "LOW" ? ["External attribution may disagree — verify before pause."] : [],
    });
  }

  let evidenceQualityOverall: EvidenceQuality = "MEDIUM";
  const scores = (input.evidence ?? []).map((e) => e.evidenceQuality);
  if (scores.every((s) => s === "LOW")) evidenceQualityOverall = "LOW";
  else if (scores.some((s) => s === "HIGH")) evidenceQualityOverall = "HIGH";

  return {
    keepRunning,
    pause,
    duplicateAndScale,
    newVariantsToTest,
    audienceExperiments,
    landingPageExperiments,
    holdForMoreData,
    rationaleNotes,
    geoExperimentHints,
    landingExperimentHints,
    evidenceQualityOverall,
    enrichedRows,
  };
}
