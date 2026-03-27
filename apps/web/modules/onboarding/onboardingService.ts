export type OnboardingRole = "broker" | "investor" | "buyer";

export type OnboardingAnalysisInput = {
  role: OnboardingRole;
  propertyInput: string;
};

export type OnboardingAnalysisResult = {
  source: "zillow" | "airbnb" | "manual";
  normalizedAddressOrUrl: string;
  city: string;
  trustScore: number;
  dealScore: number;
  verdict: "strong_deal" | "needs_review" | "high_risk";
  summary: string;
  insights: string[];
};

export async function runOnboardingAnalysis(
  input: OnboardingAnalysisInput
): Promise<OnboardingAnalysisResult> {
  const res = await fetch("/api/onboarding/analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? "Analysis failed");
  }
  return (await res.json()) as OnboardingAnalysisResult;
}
