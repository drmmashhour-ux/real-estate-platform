/**
 * Reliability scoring for ads automation — supplements rule-based classification; does not replace it.
 */

import type { AdsClassification } from "./ads-automation-v4.types";
import type { EvidenceQuality, EvidenceScoreBreakdown } from "./ads-automation-v4.types";

export type EvidenceScoreInput = {
  impressions: number;
  clicks: number;
  leads: number;
  spendKnown: boolean;
  cplComputable: boolean;
  conversionComputable: boolean;
  /** When set, penalize if classification disagrees with clear metric signals. */
  classification?: AdsClassification;
  /** Geo slices available for this campaign/window. */
  geoCoverageCount?: number;
  /** Window length in days (freshness proxy). */
  windowDays?: number;
};

const W_IMP = 0.12;
const W_CLK = 0.15;
const W_LEAD = 0.1;
const W_SPEND = 0.12;
const W_CPL = 0.1;
const W_CONV = 0.1;
const W_GEO = 0.08;
const W_FRESH = 0.08;
const W_ALIGN = 0.15;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function buildEvidenceBreakdown(input: EvidenceScoreInput): EvidenceScoreBreakdown {
  const factors: EvidenceScoreBreakdown["factors"] = [];
  let score = 0;

  const impOk = input.impressions >= 1000;
  const impPartial = input.impressions >= 200;
  const impCont = impOk ? 1 : impPartial ? 0.45 : input.impressions >= 50 ? 0.2 : 0.05;
  factors.push({
    key: "impressions_volume",
    weight: W_IMP,
    contribution: W_IMP * impCont,
    met: impOk,
    detail: `${input.impressions} landing views`,
  });
  score += W_IMP * impCont;

  const clkOk = input.clicks >= 100;
  const clkPartial = input.clicks >= 20;
  const clkCont = clkOk ? 1 : clkPartial ? 0.5 : input.clicks >= 5 ? 0.2 : 0.05;
  factors.push({
    key: "click_volume",
    weight: W_CLK,
    contribution: W_CLK * clkCont,
    met: clkOk,
    detail: `${input.clicks} cta_click`,
  });
  score += W_CLK * clkCont;

  const leadCont = input.leads >= 10 ? 1 : input.leads >= 3 ? 0.5 : input.leads >= 1 ? 0.25 : 0;
  factors.push({
    key: "lead_volume",
    weight: W_LEAD,
    contribution: W_LEAD * leadCont,
    met: input.leads >= 10,
    detail: `${input.leads} leads`,
  });
  score += W_LEAD * leadCont;

  factors.push({
    key: "spend_known",
    weight: W_SPEND,
    contribution: W_SPEND * (input.spendKnown ? 1 : 0.2),
    met: input.spendKnown,
    detail: input.spendKnown ? "Manual spend attributed" : "Spend unknown or zero",
  });
  score += W_SPEND * (input.spendKnown ? 1 : 0.2);

  factors.push({
    key: "cpl_computable",
    weight: W_CPL,
    contribution: W_CPL * (input.cplComputable ? 1 : 0.25),
    met: input.cplComputable,
    detail: input.cplComputable ? "CPL defined" : "CPL not computable",
  });
  score += W_CPL * (input.cplComputable ? 1 : 0.25);

  factors.push({
    key: "conversion_computable",
    weight: W_CONV,
    contribution: W_CONV * (input.conversionComputable ? 1 : 0.3),
    met: input.conversionComputable,
    detail: input.conversionComputable ? "Booking/booking rate usable" : "Conversion thin or undefined",
  });
  score += W_CONV * (input.conversionComputable ? 1 : 0.3);

  const geoN = input.geoCoverageCount ?? 0;
  const geoCont = geoN >= 2 ? 1 : geoN === 1 ? 0.5 : 0.15;
  factors.push({
    key: "geo_coverage",
    weight: W_GEO,
    contribution: W_GEO * geoCont,
    met: geoN >= 2,
    detail: geoN > 0 ? `${geoN} geo buckets` : "No geo metadata",
  });
  score += W_GEO * geoCont;

  const wd = input.windowDays ?? 14;
  const freshCont = wd <= 21 ? 1 : wd <= 45 ? 0.75 : 0.5;
  factors.push({
    key: "window_freshness",
    weight: W_FRESH,
    contribution: W_FRESH * freshCont,
    met: wd <= 21,
    detail: `${wd}d window`,
  });
  score += W_FRESH * freshCont;

  let alignCont = 0.7;
  if (input.classification === "weak" && input.clicks >= 50 && input.impressions >= 500) alignCont = 1;
  if (input.classification === "winner" && input.clicks >= 30 && input.impressions >= 300) alignCont = 1;
  if (input.classification === "uncertain" && input.clicks < 30) alignCont = 1;
  factors.push({
    key: "classification_signal_alignment",
    weight: W_ALIGN,
    contribution: W_ALIGN * alignCont,
    met: alignCont >= 0.95,
    detail: `Bucket: ${input.classification ?? "n/a"}`,
  });
  score += W_ALIGN * alignCont;

  return { score: clamp01(score), factors };
}

export function computeEvidenceScore(input: EvidenceScoreInput): number {
  return buildEvidenceBreakdown(input).score;
}

export function classifyEvidenceQuality(score: number): EvidenceQuality {
  if (score >= 0.65) return "HIGH";
  if (score >= 0.38) return "MEDIUM";
  return "LOW";
}
