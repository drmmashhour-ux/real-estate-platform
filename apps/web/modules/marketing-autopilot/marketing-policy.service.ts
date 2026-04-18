/**
 * Broker-controlled policy: no auto-publish for high-impact channels unless explicitly enabled.
 * Env: FEATURE_MARKETING_AUTOPILOT_AUTO_PUBLISH_LOW_RISK=1 allows auto-ready_for_review only (never public).
 */
export function allowLowRiskAutoQueue(): boolean {
  return process.env.FEATURE_MARKETING_AUTOPILOT_AUTO_PUBLISH_LOW_RISK === "true";
}

export function assertNoBannedPhrases(body: string): { ok: true } | { ok: false; reason: string } {
  const banned = [/meilleur investissement/i, /urgent(!|\b)/i, /dernière chance/i, /offre irrésistible/i];
  for (const b of banned) {
    if (b.test(body)) return { ok: false, reason: "Draft contains urgency or investment-superlative phrasing — edit manually." };
  }
  return { ok: true };
}
