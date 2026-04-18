import type { FrictionPoint, SimulationStep } from "@/modules/simulation/user-simulation.types";

function id(prefix: string, i: number): string {
  return `${prefix}_${i}`;
}

/**
 * Rule-based friction from step sequence — does not assert UX is "good"; flags patterns that often correlate with issues.
 */
export function detectFrictionFromSteps(
  steps: SimulationStep[],
  context: { journey: string; persona: string },
): FrictionPoint[] {
  const out: FrictionPoint[] = [];
  let n = 0;

  const mistakes = steps.filter((s) => s.mistake).length;
  if (mistakes >= 2) {
    out.push({
      id: id("fr", n++),
      category: "errors_validation",
      severity: "medium",
      description: "Repeated mistakes / corrections in-session",
      evidence: `${mistakes} mistake markers in ${context.journey} (${context.persona})`,
    });
  }

  const listingViews = steps.filter((s) => /listing|property/i.test(s.action)).length;
  if (listingViews >= 2 && !steps.some((s) => s.meta?.booked)) {
    out.push({
      id: id("fr", n++),
      category: "decision_paralysis",
      severity: "medium",
      description: "Multiple listing views without conversion",
      evidence: `${listingViews} listing-related steps; journey: ${context.journey}`,
    });
  }

  const paymentHesitation = steps.find((s) => s.surface === "stripe_checkout" && (s.hesitationMs ?? 0) > 6000);
  if (paymentHesitation) {
    out.push({
      id: id("fr", n++),
      category: "checkout",
      severity: "high",
      stepId: paymentHesitation.id,
      description: "Long hesitation at payment — trust or fee clarity risk",
      evidence: `hesitationMs=${paymentHesitation.hesitationMs} at checkout`,
    });
  }

  const abandon = steps.find((s) => s.abandonedHere);
  if (abandon && /publish|submit|confirm/i.test(abandon.action)) {
    out.push({
      id: id("fr", n++),
      category: "onboarding",
      severity: "high",
      stepId: abandon.id,
      description: "Abandonment near commitment step",
      evidence: abandon.action,
    });
  }

  const confusedMood = steps.filter((s) => s.mood === "confused").length;
  if (confusedMood >= 2) {
    out.push({
      id: id("fr", n++),
      category: "guidance",
      severity: "medium",
      description: "Multiple confused states logged in narrative",
      evidence: `${confusedMood} steps with mood=confused`,
    });
  }

  return out;
}
