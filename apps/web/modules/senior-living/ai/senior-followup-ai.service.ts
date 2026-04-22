/**
 * Suggestions only — never auto-send externally unless product flag enables it later.
 */
export type FollowUpAudience = "family" | "operator";

export function suggestFamilyFollowUp(args: { hesitationSignals: boolean }): string {
  if (args.hesitationSignals) return "Offer one low-pressure visit option — no decision required today.";
  return "Share one short reason this option fits what they said.";
}

export function suggestOperatorFollowUp(args: { leadBand: string; hoursSinceLead: number }): string {
  if (args.leadBand === "HIGH" && args.hoursSinceLead > 1) {
    return "Respond within the hour to keep priority with this family.";
  }
  return "A quick, friendly reply keeps trust high.";
}
