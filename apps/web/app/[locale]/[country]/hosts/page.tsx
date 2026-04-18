import { HostValueHero } from "@/components/marketing/HostValueHero";
import { HostPricingPlans } from "@/components/marketing/HostPricingPlans";
import { HostRevenueProofSection } from "@/components/marketing/HostRevenueProofSection";
import { HostCalculatorCTA } from "@/components/marketing/HostCalculatorCTA";
import { HostLeadCaptureForm } from "@/components/hosts/HostLeadCaptureForm";
import { getFeaturedBoostPackages, getPricingPlans } from "@/modules/business";
import { hostEconomicsFlags } from "@/config/feature-flags";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Public host acquisition — alias surface for `/host/value` with optional lead capture. */
export default function HostsLandingPage() {
  const allow =
    hostEconomicsFlags.pricingModelV1 &&
    (hostEconomicsFlags.hostConversionSurfacesV1 || hostEconomicsFlags.hostOnboardingFunnelV1);
  if (!allow) {
    redirect("/host");
  }

  const plans = getPricingPlans();
  const featured = getFeaturedBoostPackages().map((f) => ({
    label: f.label,
    durationDays: f.durationDays,
    priceCents: f.priceCents,
  }));

  return (
    <main className="min-h-screen bg-black">
      <HostValueHero />
      <HostRevenueProofSection />
      <HostPricingPlans plans={plans} featured={featured} />
      <HostCalculatorCTA />
      {hostEconomicsFlags.hostOnboardingFunnelV1 ? (
        <section className="px-4 py-16 text-center sm:px-6">
          <HostLeadCaptureForm />
        </section>
      ) : null}
    </main>
  );
}
