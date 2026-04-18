import { HostValueHero } from "@/components/marketing/HostValueHero";
import { HostPricingPlans } from "@/components/marketing/HostPricingPlans";
import { HostRevenueProofSection } from "@/components/marketing/HostRevenueProofSection";
import { HostCalculatorCTA } from "@/components/marketing/HostCalculatorCTA";
import { getFeaturedBoostPackages, getPricingPlans } from "@/modules/business";
import { hostEconomicsFlags } from "@/config/feature-flags";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function HostValueLandingPage() {
  if (!hostEconomicsFlags.hostConversionSurfacesV1 || !hostEconomicsFlags.pricingModelV1) {
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
    </main>
  );
}
