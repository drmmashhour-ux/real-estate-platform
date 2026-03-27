export type ExtractionFieldSource = "deterministic_stub" | "model" | "human_override";

export type NormalizedExtractionPayload = {
  version: "1";
  propertyTypeHint: string | null;
  hasCoApplicantHint: boolean | null;
  incomeDocumentPresent: boolean | null;
  liabilitiesSectionPresent: boolean | null;
  idDocumentPresent: boolean | null;
  issueKeywords: string[];
  rawMapping: Record<string, unknown>;
};
