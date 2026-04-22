import type { SeniorAiProfileInput } from "./senior-ai.types";

export function nextGuidedQuestion(profile: SeniorAiProfileInput): string | null {
  if (!profile.whoFor) return "Who is this search for?";
  if (!profile.preferredCity && !profile.preferredArea) return "Which city or area matters most?";
  if (profile.budgetMonthly == null && !profile.budgetBand) return "What monthly budget feels comfortable?";
  if (!profile.careNeedLevel) return "How much daily help is needed?";
  return null;
}

export function shouldOfferVoiceFirst(experimentVariant: string): boolean {
  return experimentVariant === "voice_first";
}
