/** Default line for SMS / social / clipboard shares */
export const SHARE_DEAL_LINE =
  "I analyzed this real estate deal — see which strategy performs better";

/** After running analysis — growth incentive copy */
export const SHARE_AFTER_ANALYSIS_LINE =
  "Share this deal and help others make smarter investments";

export function buildPublicDealUrl(dealId: string, origin: string, referrerUserId?: string): string {
  const u = new URL(`/deal/${dealId}`, origin);
  u.searchParams.set("utm_source", "share");
  if (referrerUserId) u.searchParams.set("ru", referrerUserId);
  return u.toString();
}

/** Invite to analyzer (before a deal is saved to the account — still shareable) */
export function buildAnalyzeInviteShareUrl(origin: string, referrerUserId?: string): string {
  const u = new URL("/analyze", origin);
  u.searchParams.set("utm_source", "share");
  u.searchParams.set("utm_medium", "organic");
  if (referrerUserId) u.searchParams.set("ru", referrerUserId);
  u.hash = "analyzer";
  return u.toString();
}

export function buildShareDealMessage(dealId: string, origin: string, referrerUserId?: string): string {
  return `${SHARE_DEAL_LINE}\n\n${buildPublicDealUrl(dealId, origin, referrerUserId)}`;
}

/** Clipboard text after analysis — public deal link when saved, else analyzer invite */
export function buildShareAfterAnalysisCopy(
  dealId: string | null,
  origin: string,
  referrerUserId?: string | null
): string {
  if (dealId) {
    return `${SHARE_AFTER_ANALYSIS_LINE}\n\n${buildPublicDealUrl(dealId, origin, referrerUserId ?? undefined)}`;
  }
  return `${SHARE_AFTER_ANALYSIS_LINE}\n\n${buildAnalyzeInviteShareUrl(origin, referrerUserId ?? undefined)}`;
}

/** Invite-a-friend block on dashboard */
export const INVITE_FRIEND_LINE =
  "I'm using LECIPM to analyze real estate deals — try the free analyzer (no signup required to run numbers):";

export function buildInviteFriendMessage(origin: string, referrerUserId?: string): string {
  const analyzer = `${INVITE_FRIEND_LINE}\n\n${buildAnalyzeInviteShareUrl(origin, referrerUserId)}`;
  if (!referrerUserId?.trim()) return analyzer;
  const viral = new URL("/invite", origin);
  viral.searchParams.set("ref", referrerUserId.trim());
  return `${analyzer}\n\nFull account invite (referral rewards on conversion):\n${viral.toString()}`;
}

/** Viral “share the tool” copy (dashboard banner) */
export const VIRAL_TOOL_LINE =
  "Know someone investing in real estate? Try LECIPM — analyze rental strategies and ROI before you buy.";

export function buildViralToolMessage(origin: string): string {
  const u = new URL("/analyze", origin);
  u.searchParams.set("utm_source", "referral");
  return `${VIRAL_TOOL_LINE}\n\n${u.toString()}`;
}
