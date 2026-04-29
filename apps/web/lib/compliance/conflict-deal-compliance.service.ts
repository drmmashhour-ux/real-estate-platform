import "server-only";

/** Shape passed to DealConflictDisclosureClient when surfaced. */
export type DealConflictDisclosureSurface = {
  warningMessage: string;
  acknowledgmentText: string;
  reasons: string[];
  viewerMustAcknowledge: boolean;
  viewerHasAcknowledged: boolean;
};

export async function refreshDealConflictComplianceState(_dealId: string): Promise<void> {
  /* Placeholder hook for future deterministic conflict replay. */
}

export async function getDealConflictDisclosureSurface(
  _dealId: string,
  _viewerUserId: string
): Promise<DealConflictDisclosureSurface | null> {
  return null;
}
