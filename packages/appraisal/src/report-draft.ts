import { APPRAISAL_SUPPORT_LABELS } from "@/lib/appraisal/compliance-copy";
import { computeIndicativeValueFromPricesCents } from "@/lib/appraisal/valuation-engine";

export type IndicativeValueBlock = ReturnType<typeof computeIndicativeValueFromPricesCents>;

export type ReportDraftSections = {
  title: string;
  productDisclaimer: string;
  scope: string;
  approaches: { comparative?: string; income?: string; cost?: string; land?: string };
  valueIndication: IndicativeValueBlock | null;
  generatedAt: string;
};

export function buildAppraisalReportDraft(input: {
  title?: string | null;
  valueBlock: IndicativeValueBlock | null;
}): ReportDraftSections {
  return {
    title: input.title?.trim() || "Appraisal report draft",
    productDisclaimer: APPRAISAL_SUPPORT_LABELS.disclaimerShort,
    scope: "Subject property and selected comparables per broker workspace.",
    approaches: {
      comparative: "Sales comparison — map-selected and analysis comparables.",
      income: "Income approach — optional; complete assumptions in Income workspace.",
      cost: "Cost approach — optional; complete cost assumptions in Cost workspace.",
      land: "Land / lot — optional; see Land workspace for unimproved logic.",
    },
    valueIndication: input.valueBlock,
    generatedAt: new Date().toISOString(),
  };
}
