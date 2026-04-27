import { flags } from "@/lib/flags";

import { OnboardingView } from "./OnboardingView";

export default function Onboarding() {
  return <OnboardingView recoEnabled={flags.RECOMMENDATIONS} />;
}
