import type { Metadata } from "next";
import OnboardingPageClient from "./onboardingPage";

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Role selection, property input, and instant analysis onboarding.",
};

export default function OnboardingPage() {
  return <OnboardingPageClient />;
}
