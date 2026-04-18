import Link from "next/link";
import { MvpNav } from "@/components/investment/MvpNav";
import { requireMortgageBrokerAccount } from "@/modules/mortgage/services/require-broker-dashboard";
import { revenueV4Flags, hostEconomicsFlags } from "@/config/feature-flags";
import { buildPlatformPricingSnapshot } from "@/modules/pricing-model/pricing-engine.service";
import { BrokerPricingClient } from "./broker-pricing-client";

export const dynamic = "force-dynamic";

export default async function BrokerPricingPage() {
  await requireMortgageBrokerAccount();

  const feeSnap = revenueV4Flags.pricingEngineV1 ? buildPlatformPricingSnapshot() : null;
  const platformFeeTransparency = feeSnap
    ? { brokerage: feeSnap.brokerage, disclaimers: feeSnap.disclaimers }
    : null;
  const showBrokerRoi = Boolean(feeSnap && hostEconomicsFlags.roiCalculatorV1);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-50">
      <MvpNav variant="live" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <BrokerPricingClient platformFeeTransparency={platformFeeTransparency} showBrokerRoi={showBrokerRoi} />
        <p className="mt-10 text-center text-sm text-slate-500">
          <Link href="/broker/dashboard" className="text-premium-gold hover:underline">
            ← Broker dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
