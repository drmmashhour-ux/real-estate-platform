import type { Metadata } from "next";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { PricingCatalogSection, PricingComparisonTable } from "@/components/pricing";
import { buyerPlans } from "@/lib/pricing/public-catalog";
import { PLATFORM_NAME } from "@/config/branding";

const title = "Buyer pricing";

export const metadata: Metadata = {
  title,
  description: `Buyer plans for ${PLATFORM_NAME} — Free, Basic, Pro, and Elite.`,
};

export default function BuyerPricingPage() {
  return (
    <div className="px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Buyers"
          title="Buyer pricing"
          subtitle="Start free. Upgrade when you want broker contact, alerts, and deeper AI guidance."
        />

        <div className="mt-14">
          <PricingCatalogSection hub="buyer" plans={buyerPlans} />
        </div>

        <div className="mt-20">
          <h2 className="font-serif text-xl font-semibold text-white">Compare plans</h2>
          <p className="mt-2 text-sm text-slate-400">Feature availability by tier.</p>
          <PricingComparisonTable
            className="mt-6"
            columns={[
              { id: "free", label: "Free" },
              { id: "basic", label: "Basic" },
              { id: "pro", label: "Pro" },
              { id: "elite", label: "Elite" },
            ]}
            rows={[
              {
                label: "Search listings",
                cells: { free: true, basic: true, pro: true, elite: true },
              },
              {
                label: "View property details",
                cells: { free: true, basic: true, pro: true, elite: true },
              },
              {
                label: "Save favorites",
                cells: { free: true, basic: true, pro: true, elite: true },
              },
              {
                label: "Contact listing broker",
                cells: { free: false, basic: true, pro: true, elite: true },
              },
              {
                label: "Alerts",
                cells: { free: false, basic: true, pro: true, elite: true },
              },
              {
                label: "Limited AI insights",
                cells: { free: false, basic: true, pro: true, elite: true },
              },
              {
                label: "Platform broker support",
                cells: { free: false, basic: false, pro: true, elite: true },
              },
              {
                label: "Advanced AI analysis",
                cells: { free: false, basic: false, pro: true, elite: true },
              },
              {
                label: "Deal guidance",
                cells: { free: false, basic: false, pro: true, elite: true },
              },
              {
                label: "Priority service & negotiation help",
                cells: { free: false, basic: false, pro: false, elite: true },
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
