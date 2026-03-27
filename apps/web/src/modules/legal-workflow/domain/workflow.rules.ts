import type { LegalDocumentStatus } from "@/src/modules/legal-workflow/domain/workflow.types";

const allowed: Record<LegalDocumentStatus, LegalDocumentStatus[]> = {
  draft: ["in_review", "needs_changes"],
  in_review: ["needs_changes", "approved"],
  needs_changes: ["in_review", "draft"],
  approved: ["finalized", "needs_changes"],
  finalized: ["exported", "signed"],
  exported: ["signed"],
  signed: [],
};

export function canTransition(from: LegalDocumentStatus, to: LegalDocumentStatus) {
  return allowed[from]?.includes(to) ?? false;
}
