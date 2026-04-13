import type { Metadata } from "next";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { PricingCatalogSection, PricingComparisonTable } from "@/components/pricing";
import { sellerPlans } from "@/lib/pricing/public-catalog";
import { PLATFORM_NAME } from "@/config/branding";

const title = "Seller pricing";

export const metadata: Metadata = {
  title,
  description: `Seller and FSBO listing plans for ${PLATFORM_NAME}.`,
};

export default function SellerPricingPage() {
  return (
    <div className="px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Sellers"
          title="Seller pricing"
          subtitle="From limited visibility to featured placement, AI pricing, and broker collaboration."
        />

        <div className="mt-14">
          <PricingCatalogSection hub="seller" plans={sellerPlans} />
        </div>

        <div className="mt-10 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-sm text-amber-100/90">
          <p className="font-medium text-amber-200">Commission note</p>
          <p className="mt-1 text-amber-100/80">
            A commission may apply when a deal is completed through broker collaboration or coordinated platform
            services — not as a direct seller subscription charge. Final terms are confirmed at checkout and in your
            listing agreement flow.
          </p>
        </div>

        <div className="mt-16">
          <h2 className="font-serif text-xl font-semibold text-white">Compare plans</h2>
          <p className="mt-2 text-sm text-slate-400">What you get at each tier.</p>
          <PricingComparisonTable
            className="mt-6"
            columns={[
              { id: "free", label: "Free" },
              { id: "standard", label: "Standard" },
              { id: "pro", label: "Pro" },
              { id: "premium", label: "Premium" },
            ]}
            rows={[
              {
                label: "Create listing",
                cells: { free: true, standard: true, pro: true, premium: true },
              },
              {
                label: "Basic exposure",
                cells: { free: true, standard: true, pro: true, premium: true },
              },
              {
                label: "Better visibility",
                cells: { free: false, standard: true, pro: true, premium: true },
              },
              {
                label: "Listing tools",
                cells: { free: false, standard: true, pro: true, premium: true },
              },
              {
                label: "Premium placement",
                cells: { free: false, standard: false, pro: true, premium: true },
              },
              {
                label: "AI pricing help",
                cells: { free: false, standard: false, pro: true, premium: true },
              },
              {
                label: "Analytics",
                cells: { free: false, standard: false, pro: true, premium: true },
              },
              {
                label: "Featured listing",
                cells: { free: false, standard: false, pro: false, premium: true },
              },
              {
                label: "Broker collaboration",
                cells: { free: false, standard: false, pro: false, premium: true },
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
