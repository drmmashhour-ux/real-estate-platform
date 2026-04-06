export const APPROVAL_STATUSES = ["pending", "approved", "rejected", "executed"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export function isApprovalStatus(s: string | null | undefined): s is ApprovalStatus {
  return s != null && (APPROVAL_STATUSES as readonly string[]).includes(s);
}

export type CreateAutonomyApprovalInput = {
  actionType: string;
  riskTier: string;
  payload?: Record<string, unknown>;
  summary?: string | null;
  requestedByUserId?: string | null;
};
