export type ValidationSeverity = "info" | "warning" | "critical";

export type ValidationIssue = {
  severity: ValidationSeverity;
  code: string;
  title: string;
  summary: string;
  affectedFormKey?: string;
  affectedFieldKeys?: string[];
  suggestedAction?: string;
  sourceReferences: { sourceName: string; formCode?: string; pageNumber?: number | null; sectionLabel?: string }[];
  brokerReviewRequired: true;
};
