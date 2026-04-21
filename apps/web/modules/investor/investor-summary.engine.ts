import type { ConfidenceTier } from "@/modules/investor/investor.types";

export type SummaryPair = {
  /** ~2–4 sentences — operational */
  concise: string;
  /** Formal tone — committee read */
  boardReady: string;
};

export function buildExecutiveSummaries(input: {
  memoTypeLabel: string;
  listingTitle: string;
  recommendationLabel: string;
  confidence: ConfidenceTier;
  esgOneLiner: string;
  acquisitionOneLiner: string;
  riskOneLiner: string;
  nextStepHint: string;
}): SummaryPair {
  const conf =
    input.confidence === "HIGH" ? "Higher confidence given structured evidence coverage."
    : input.confidence === "MEDIUM" ? "Moderate confidence — several items still depend on diligence."
    : input.confidence === "LOW" ?
      "Low confidence — investor conclusions should wait for stronger proof or updates."
    : "Confidence not assessed from available structured inputs.";

  const concise =
    `${input.memoTypeLabel} for ${input.listingTitle}: ${input.recommendationLabel}. ${conf} ` +
    `ESG: ${input.esgOneLiner} Acquisition screen: ${input.acquisitionOneLiner} ` +
    `Risk posture: ${input.riskOneLiner} ${input.nextStepHint}`;

  const boardReady =
    `This ${input.memoTypeLabel.toLowerCase()} synthesizes currently available structured platform data ` +
    `for **${input.listingTitle}**. Recommendation: **${input.recommendationLabel}**. ${conf} ` +
    `Environmental readiness: ${input.esgOneLiner} Screening context: ${input.acquisitionOneLiner} ` +
    `Risk overview: ${input.riskOneLiner} Immediate governance focus: ${input.nextStepHint}`;

  return { concise, boardReady };
}
