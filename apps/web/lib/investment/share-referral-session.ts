/** Session key: inbound ?ref= deal id — appended to outbound share links for chain tracking */
const SESSION_REF_KEY = "lecipm_share_ref_deal";

export function setInboundShareRef(referrerDealId: string, viewedDealId: string): void {
  if (typeof window === "undefined") return;
  if (!referrerDealId || referrerDealId === viewedDealId) return;
  try {
    sessionStorage.setItem(SESSION_REF_KEY, referrerDealId);
  } catch {
    /* ignore */
  }
}

export function readShareRefFromSession(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(SESSION_REF_KEY);
  } catch {
    return null;
  }
}
