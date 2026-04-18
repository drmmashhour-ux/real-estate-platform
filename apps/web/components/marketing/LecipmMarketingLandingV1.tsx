import dynamic from "next/dynamic";
import { LandingNavbar } from "@/components/marketing/LandingNavbar";
import { Hero } from "@/components/marketing/Hero";
import { SearchBar } from "@/components/marketing/SearchBar";
import { ComparisonSection } from "@/components/marketing/ComparisonSection";
import { RoiProofSection } from "@/components/marketing/RoiProofSection";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { AutopilotSection } from "@/components/marketing/AutopilotSection";
import { PricingSection } from "@/components/marketing/PricingSection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Footer } from "@/components/marketing/Footer";
import { LandingScrollDepth } from "@/components/marketing/LandingScrollDepth";
import { useConversionEngineFlags } from "@/lib/conversion/use-conversion-engine-flags";
import { ConversionHomeBoost } from "@/components/conversion/ConversionHomeBoost";
import { HomeMarketingFunnelPv } from "@/components/marketing/HomeMarketingFunnelPv";

const HostsSection = dynamic(() => import("@/components/marketing/HostsSection").then((m) => m.HostsSection));
const ClientsSection = dynamic(() => import("@/components/marketing/ClientsSection").then((m) => m.ClientsSection));

/**
 * Full high-conversion marketing landing — use when `FEATURE_LANDING_V1` is on.
 * Pair with `NEXT_PUBLIC_FEATURE_LANDING_V1` to hide global header/footer on home for a standalone shell.
 */
export function LecipmMarketingLandingV1() {
  const conversionEngineFlags = useConversionEngineFlags();
  return (
    <div className="flex min-h-screen flex-col bg-landing-black text-landing-text">
      <HomeMarketingFunnelPv />
      <LandingScrollDepth />
      <LandingNavbar />
      <main className="flex-1">
        <Hero />
        {conversionEngineFlags.conversionUpgradeV1 ? <ConversionHomeBoost /> : null}
        <SearchBar />
        <ComparisonSection />
        <RoiProofSection />
        <HowItWorks />
        <AutopilotSection />
        <HostsSection />
        <ClientsSection />
        <PricingSection />
        <TestimonialsSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
