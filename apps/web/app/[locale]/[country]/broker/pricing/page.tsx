import Link from "next/link";
import { MvpNav } from "@/components/investment/MvpNav";
import { requireMortgageBrokerAccount } from "@/modules/mortgage/services/require-broker-dashboard";
import { BrokerPricingClient } from "./broker-pricing-client";

export const dynamic = "force-dynamic";

export default async function BrokerPricingPage() {
  await requireMortgageBrokerAccount();

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-50">
      <MvpNav variant="live" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <BrokerPricingClient />
        <p className="mt-10 text-center text-sm text-slate-500">
          <Link href="/broker/dashboard" className="text-premium-gold hover:underline">
            ← Broker dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
