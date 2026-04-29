/** Co-ownership checklist items — enums + row shape mirrored from Prisma (no `@prisma/client`). */

export type ComplianceChecklistItemStatus = "PENDING" | "COMPLETED" | "NOT_APPLICABLE";

export type ComplianceVerificationLevel = "DECLARED" | "DOCUMENTED" | "VERIFIED";

export type ChecklistItemCategory = "COOWNERSHIP" | "INSURANCE";

export type ChecklistPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/** Same field set as UI `Pick<ChecklistItem, …>` in CoOwnershipCompliancePanel. */
export type ChecklistItemView = {
  id: string;
  key: string;
  label: string;
  status: ComplianceChecklistItemStatus;
  required: boolean;
  category: ChecklistItemCategory;
  priority: ChecklistPriority;
  description?: string | null;
  source?: string | null;
  verificationLevel: ComplianceVerificationLevel;
  verifiedAt?: Date | string | null;
  verifiedByUserId?: string | null;
  supportingDocumentIds?: unknown;
  validUntil?: Date | string | null;
  isExpired: boolean;
  isOverridden: boolean;
  overrideReason?: string | null;
};
