/**
 * In `next dev`, suppress global marketing overlays (cookie, onboarding, timed feedback)
 * so local QA and Playwright are not blocked. Production and `next start` are unchanged.
 */
export function suppressGlobalMarketingOverlays(): boolean {
  return process.env.NODE_ENV === "development";
}
