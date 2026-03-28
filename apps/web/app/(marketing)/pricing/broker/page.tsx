import type { Metadata } from "next";
import Link from "next/link";
import { BrokerPricingConversion } from "@/components/pricing/BrokerPricingConversion";
import { PricingComparisonTable } from "@/components/pricing";
import { PLATFORM_NAME } from "@/config/branding";

const title = "Broker pricing";

export const metadata: Metadata = {
  title,
  description: `Trust verification, leads, and analytics for broker teams on ${PLATFORM_NAME}.`,
};

export default function BrokerPricingPage() {
  return (
    <div className="px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <BrokerPricingConversion />

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-sm text-slate-400">
          <p>
            Lead purchases and success fees may apply separately in your market — see{" "}
            <Link href="/dashboard/broker" className="text-premium-gold hover:underline">
              Broker dashboard
            </Link>{" "}
            and deal workflows for live numbers.
          </p>
        </div>

        <div className="mt-16">
          <h2 className="font-serif text-xl font-semibold text-white">Compare plans</h2>
          <p className="mt-2 text-sm text-slate-400">At-a-glance feature access by tier.</p>
          <PricingComparisonTable
            className="mt-6"
            columns={[
              { id: "free", label: "Free" },
              { id: "pro", label: "Pro" },
              { id: "elite", label: "Platinum" },
            ]}
            rows={[
              {
                label: "Trust verification",
                cells: { free: false, pro: true, elite: true },
              },
              {
                label: "Seller readiness tools",
                cells: { free: false, pro: true, elite: true },
              },
              {
                label: "Listing boost / placement",
                cells: { free: false, pro: true, elite: true },
              },
              {
                label: "Basic analytics",
                cells: { free: false, pro: true, elite: true },
              },
              {
                label: "Priority leads",
                cells: { free: false, pro: false, elite: true },
              },
              {
                label: "Premium placement",
                cells: { free: false, pro: false, elite: true },
              },
              {
                label: "Advanced analytics",
                cells: { free: false, pro: false, elite: true },
              },
              {
                label: "Compliance tooling",
                cells: { free: false, pro: false, elite: true },
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
