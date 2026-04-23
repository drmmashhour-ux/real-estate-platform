const GUARANTEED_INVESTMENT_RE =
  /guaranteed\s+(return|profit|yield)|certain\s+winner|risk-?free\s+investment|can't\s+lose|cannot\s+lose/i;

export function assertNoGuaranteedNeighborhoodOutcomeLanguage(...parts: string[]): void {
  const text = parts.filter(Boolean).join(" ");
  if (GUARANTEED_INVESTMENT_RE.test(text)) {
    throw new Error("GUARANTEED_INVESTMENT_LANGUAGE_FORBIDDEN");
  }
}

export function assertNeighborhoodScoreInputsForAi(profile: {
  scoreOverall: number | null | undefined;
  comparableCount: number | null | undefined;
}): void {
  if (profile.scoreOverall == null || !Number.isFinite(profile.scoreOverall)) {
    throw new Error("NEIGHBORHOOD_SCORE_INPUTS_REQUIRED");
  }
}
