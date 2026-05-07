/**
 * Review proposals for appraisal adjustments — stub for deployment.
 */
export async function approveAdjustmentProposal(
  proposalId: string,
  userId: string
): Promise<{ ok: boolean }> {
  void proposalId;
  void userId;
  return { ok: true };
}

export async function rejectAdjustmentProposal(
  proposalId: string,
  userId: string,
  reason?: string
): Promise<{ ok: boolean }> {
  void proposalId;
  void userId;
  void reason;
  return { ok: true };
}
