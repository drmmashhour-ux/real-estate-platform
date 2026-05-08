/**
 * Appraisal audit logging — stub for deployment.
 */
export async function logAppraisalAudit(opts: {
  userId: string;
  action: string;
  listingId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  console.log("[appraisal-audit]", opts.action, opts.listingId ?? "");
}
