/**
 * Session flag — checkout / billing UIs can noop while guided investor playback runs.
 */

export const INVESTOR_GUIDED_SESSION_KEY = "lecipm_guided_investor_demo_safe";

export function setInvestorGuidedSafeFlag(enabled: boolean): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    if (enabled) sessionStorage.setItem(INVESTOR_GUIDED_SESSION_KEY, "1");
    else sessionStorage.removeItem(INVESTOR_GUIDED_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function readInvestorGuidedSafeFlag(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(INVESTOR_GUIDED_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}
