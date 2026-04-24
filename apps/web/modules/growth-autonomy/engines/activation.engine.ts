import { getFunnelSnapshot } from "../context.service";

/**
 * Improves first value moment and reduces onboarding drop-off.
 */
export async function runActivationOptimization() {
  const snapshot = await getFunnelSnapshot();
  const suggestions: string[] = [];

  if (snapshot.onboardingDropoff > 0.4) {
    suggestions.push("Collapse steps 2 and 3 of broker onboarding into a single view");
    suggestions.push("Add progress bar to onboarding flow to set expectations");
  }

  if (snapshot.activationRate < 0.2) {
    suggestions.push("Trigger email nudge 24h after signup if no listing created");
  }

  return { suggestions };
}
