import type { ComplianceCaseSeverity, ComplianceCaseStatus, ComplianceCaseType } from "@prisma/client";

export type { ComplianceCaseSeverity, ComplianceCaseStatus, ComplianceCaseType };

export type ComplianceCaseSummary = {
  id: string;
  dealId: string | null;
  caseType: ComplianceCaseType;
  severity: ComplianceCaseSeverity;
  status: ComplianceCaseStatus;
  summary: string;
  openedBySystem: boolean;
  assignedReviewerId: string | null;
  createdAt: string;
  updatedAt: string;
};
