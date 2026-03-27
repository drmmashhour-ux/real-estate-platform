/** Default 7-day broker trial window. */
const MORTGAGE_TRIAL_MS = 7 * 24 * 60 * 60 * 1000;

export function defaultMortgageTrialEndsAt(from = new Date()): Date {
  return new Date(from.getTime() + MORTGAGE_TRIAL_MS);
}

export function isMortgageTrialExpired(plan: string, trialEndsAt: Date | null, now = new Date()): boolean {
  if (plan !== "trial") return false;
  if (!trialEndsAt) return false;
  return trialEndsAt <= now;
}
