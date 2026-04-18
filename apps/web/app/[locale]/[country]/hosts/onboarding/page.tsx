import { hostEconomicsFlags } from "@/config/feature-flags";
import { redirect } from "next/navigation";
import { HostsOnboardingClient } from "./hosts-onboarding-client";

export const dynamic = "force-dynamic";

export default function HostsOnboardingPage() {
  if (!hostEconomicsFlags.hostOnboardingFunnelV1) {
    redirect("/hosts");
  }
  return <HostsOnboardingClient />;
}
