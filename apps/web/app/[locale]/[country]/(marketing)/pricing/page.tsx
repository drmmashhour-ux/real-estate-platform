import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { AnimatedReveal } from "@/components/marketing/AnimatedReveal";
import { PricingCatalogSection } from "@/components/pricing/PricingCatalogSection";
import {
  buyerPlans,
  brokerPlans,
  bnhubHostPlans,
  sellerPlans,
} from "@/lib/pricing/public-catalog";
import { PLATFORM_NAME } from "@/config/branding";
import { InlineUpgradeBanner } from "@/components/conversion/InlineUpgradeBanner";
import { PrimaryConversionCTA } from "@/components/conversion/PrimaryConversionCTA";
import { conversionCopy } from "@/src/design/conversionCopy";
import { ComparisonTable } from "@/components/pricing/ComparisonTable";
import { revenueV4Flags } from "@/config/feature-flags";

const title = "Pricing";
const description = `Plans for buyers, sellers, hosts, and brokers — ${PLATFORM_NAME}.`;

const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

export const metadata: Metadata = {
  title,
  description,
  ...(siteUrl
    ? {
        metadataBase: new URL(siteUrl),
        openGraph: {
          title: `${title} | ${PLATFORM_NAME}`,
          description,
          url: `${siteUrl}/pricing`,
        },
      }
    : {
        openGraph: {
          title: `${title} | ${PLATFORM_NAME}`,
          description,
        },
      }),
};

export default function PricingOverviewPage() {
  return (
    <div className="bg-black px-4 py-12 text-white sm:px-6 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <AnimatedReveal>
          <SectionHeading
            eyebrow="Pricing"
            title={conversionCopy.upgrade.title}
            subtitle={conversionCopy.upgrade.subtitle}
          />
        </AnimatedReveal>
        <div className="mt-6">
          <InlineUpgradeBanner text="Unlock advanced trust, deal, CRM, and automation insights when you are ready." />
        </div>

        <div className="mt-16 space-y-24">
          <AnimatedReveal delayMs={0}>
            <PricingCatalogSection
              hub="buyer"
              eyebrow="Buyers"
              title="Buyer plans"
              subtitle={conversionCopy.upgrade.plans.free.join(" • ")}
              plans={buyerPlans}
              detailsHref="/pricing/buyer"
              detailsLabel="Buyer plan details"
            />
          </AnimatedReveal>

          <AnimatedReveal delayMs={80}>
            <PricingCatalogSection
              hub="seller"
              eyebrow="Sellers"
              title="Seller plans"
              subtitle={conversionCopy.upgrade.plans.pro.join(" • ")}
              plans={sellerPlans}
              detailsHref="/pricing/seller"
              detailsLabel="Seller plan details"
            />
          </AnimatedReveal>

          <AnimatedReveal delayMs={120}>
            <PricingCatalogSection
              hub="bnhub"
              eyebrow="BNHUB"
              title="Host plans"
              subtitle={conversionCopy.upgrade.plans.platinum.join(" • ")}
              plans={bnhubHostPlans}
              detailsHref="/pricing/bnhub"
              detailsLabel="BNHUB fees & host plans"
            />
          </AnimatedReveal>

          <AnimatedReveal delayMs={160}>
            <PricingCatalogSection
              hub="broker"
              eyebrow="Brokers"
              title="Broker plans"
              subtitle={conversionCopy.upgrade.plans.pro.join(" • ")}
              plans={brokerPlans}
              detailsHref="/pricing/broker"
              detailsLabel="Broker plan details"
            />
          </AnimatedReveal>
        </div>

        {revenueV4Flags.pricingEngineV1 ? (
          <AnimatedReveal delayMs={200}>
            <div className="mt-16">
              <h2 className="font-serif text-2xl font-semibold text-white">How we talk about fees</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                No fabricated “savings vs Airbnb” — checkout shows line items; competitor comparisons in ROI tools use{" "}
                <strong className="text-slate-200">your</strong> inputs.
              </p>
              <div className="mt-8">
                <ComparisonTable
                  rows={[
                    {
                      label: "Guest checkout",
                      lecipm: "Stripe + line-item fees before pay",
                      notes: "BNHub service fee % on lodging subtotal after discounts.",
                    },
                    {
                      label: "Host net",
                      lecipm: "Plan-based booking fee + optional subscription",
                      notes: "Configured in product (`LECIPM_*` env) — shown in host dashboard.",
                    },
                    {
                      label: "Broker economics",
                      lecipm: "Pay-per-lead anchor + deal commissions",
                      notes: "See CRM billing — not a guaranteed income model.",
                    },
                  ]}
                />
              </div>
            </div>
          </AnimatedReveal>
        ) : null}

        <p className="mt-16 text-center text-sm text-slate-500">
          {conversionCopy.upgrade.trustLine}. Taxes may apply. Enterprise or brokerage-wide rollouts —{" "}
          <Link href="/contact" className="text-premium-gold hover:underline">
            contact sales
          </Link>
          .
        </p>
        <div className="mt-6 text-center">
          <PrimaryConversionCTA href="/auth/signup" label={conversionCopy.upgrade.ctaSecondary} event="conversion_trigger" />
        </div>
      </div>
    </div>
  );
}
