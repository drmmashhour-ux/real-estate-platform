/** Compliance queue UI — mirror Prisma enums without `@prisma/client`. */
export type ComplianceCaseSeverity = "low" | "medium" | "high" | "critical";

export type ComplianceCaseType =
  | "missing_disclosure"
  | "representation_risk"
  | "document_inconsistency"
  | "execution_readiness_risk"
  | "communication_compliance_risk"
  | "payment_workflow_risk"
  | "closing_readiness_risk"
  | "suspicious_activity_internal";

export type ComplianceCaseStatus =
  | "open"
  | "under_review"
  | "action_required"
  | "resolved"
  | "dismissed"
  | "escalated"
  | "archived";

/** Minimum fields referenced by compliance admin UI panels. */
export type ComplianceFindingView = {
  id: string;
  findingType?: string | null;
  severity: ComplianceCaseSeverity;
  title: string;
  summary: string;
  affectedEntityType?: string | null;
  affectedEntityId?: string | null;
  metadata?: unknown;
  createdAt?: Date | string;
};

export type ComplianceCaseView = {
  id: string;
  dealId?: string | null;
  documentId?: string | null;
  listingId?: string | null;
  lecipmContactId?: string | null;
  caseType: ComplianceCaseType;
  severity: ComplianceCaseSeverity;
  status?: ComplianceCaseStatus;
  summary: string;
  findings?: unknown;
  openedBySystem?: boolean;
  assignedReviewerId?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

/** Escalation strip + QA boards (admin compliance). */
export type ComplianceEscalationView = {
  id: string;
  caseId: string;
  escalationType: string;
  status: string;
  targetRole: string;
  complianceCase: Pick<
    ComplianceCaseView,
    "id" | "summary" | "severity" | "dealId" | "status"
  > | null;
};

export type QaReviewView = {
  id: string;
  dealId?: string | null;
  reviewType: string;
  status: string;
  outcome?: string | null;
  assignedToUserId?: string | null;
  updatedAt: Date;
};
