import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { PricingCatalogSection, PricingComparisonTable } from "@/components/pricing";
import { bnhubHostPlans } from "@/lib/pricing/public-catalog";
import { PLATFORM_NAME } from "@/config/branding";

const title = "BNHUB pricing";

export const metadata: Metadata = {
  title,
  description: `BNHUB host and guest fees, plus optional host plans on ${PLATFORM_NAME}.`,
};

export default function BnhubPricingPage() {
  return (
    <div className="px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="BNHUB"
          title="BNHUB pricing"
          subtitle="Airbnb-class economics with platform-controlled booking fees — plus optional subscriptions for hosts who want more visibility."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-premium-gold/25 bg-gradient-to-br from-premium-gold/10 to-transparent p-6">
            <h2 className="font-serif text-lg font-semibold text-white">Booking fees (every stay)</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex justify-between gap-4 border-b border-white/10 pb-2">
                <span>Host fee</span>
                <span className="font-semibold text-premium-gold">~3%</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Guest service fee</span>
                <span className="font-semibold text-premium-gold">~10–14%</span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              Exact percentages can vary by jurisdiction and listing — shown at checkout before you pay.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="font-serif text-lg font-semibold text-white">Why optional host plans?</h2>
            <p className="mt-3 text-sm text-slate-400">
              Subscriptions add ranking boost, analytics, and AI-assisted pricing suggestions. They do not replace
              booking fees — they help you earn more from the same calendar.
            </p>
            <Link
              href="/bnhub/stays"
              className="mt-5 inline-flex text-sm font-medium text-premium-gold hover:underline"
            >
              Browse stays →
            </Link>
          </div>
        </div>

        <div className="mt-14">
          <PricingCatalogSection
            hub="bnhub"
            title="Host subscription plans"
            subtitle="Billed in addition to per-booking host and guest fees."
            plans={bnhubHostPlans}
          />
        </div>

        <div className="mt-16">
          <h2 className="font-serif text-xl font-semibold text-white">Compare host plans</h2>
          <p className="mt-2 text-sm text-slate-400">Add-ons on top of standard BNHUB fees.</p>
          <PricingComparisonTable
            className="mt-6"
            columns={[
              { id: "free", label: "Free" },
              { id: "pro", label: "Pro" },
              { id: "elite", label: "Elite" },
            ]}
            rows={[
              {
                label: "Host dashboard & calendar",
                cells: { free: true, pro: true, elite: true },
              },
              {
                label: "Ranking boost",
                cells: { free: false, pro: true, elite: true },
              },
              {
                label: "Listing analytics",
                cells: { free: false, pro: true, elite: true },
              },
              {
                label: "AI pricing suggestions",
                cells: { free: false, pro: false, elite: true },
              },
              {
                label: "Priority placement",
                cells: { free: false, pro: false, elite: true },
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
