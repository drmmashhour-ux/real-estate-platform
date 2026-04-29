import "server-only";

export function approvalOutcomeAfterApply(_row: unknown, appliedOk: boolean): string {
  return appliedOk ? "applied_ok" : "apply_failed";
}

export async function recordHostAutopilotApprovalReview(_input: {
  hostId: string;
  row: unknown;
  outcomeType: string;
}): Promise<void> {}
