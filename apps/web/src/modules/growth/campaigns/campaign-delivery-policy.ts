/**
 * Provider-agnostic delivery gate before any send (Resend/push/etc.).
 * Does not mutate queue rows — callers should record `queued` → `sent` | `failed` on the outbound provider + audit log.
 * `Lead.optedOutOfFollowUp` is enforced in audience queries for broker campaigns; merge `User` marketing prefs here when available.
 */
export function canDeliverCampaignCandidate(input: {
  marketingOptOut: boolean;
  userBlocked: boolean;
}): { deliver: boolean; reason?: string } {
  if (input.userBlocked) return { deliver: false, reason: "user_blocked" };
  if (input.marketingOptOut) return { deliver: false, reason: "marketing_opt_out" };
  return { deliver: true };
}
