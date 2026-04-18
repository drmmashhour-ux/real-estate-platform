import { NextRequest, NextResponse } from "next/server";
import { revenueV4Flags, hostEconomicsFlags, lecipmMonetizationSystemV1 } from "@/config/feature-flags";
import { buildPlatformPricingSnapshot } from "@/modules/pricing-model/pricing-engine.service";
import { listRevenueStreams, getMonetizationEnvSummary } from "@/modules/monetization/revenue-stream.service";
import { listUpsellOffers } from "@/modules/monetization/upsell-engine.service";
import { trackMonetizationPricingSnapshotRead } from "@/lib/analytics/monetization-analytics";

export const dynamic = "force-dynamic";

/** GET /api/pricing — unified transparent snapshot (plans + BNHub fee anchors + brokerage anchors). */
export async function GET(req: NextRequest) {
  const on =
    revenueV4Flags.pricingEngineV1 ||
    hostEconomicsFlags.pricingModelV1 ||
    lecipmMonetizationSystemV1.pricingV1;
  if (!on) {
    return NextResponse.json({ error: "Pricing API disabled" }, { status: 403 });
  }

  const snapshot = buildPlatformPricingSnapshot();
  const monetization =
    revenueV4Flags.monetizationEngineV1 || lecipmMonetizationSystemV1.monetizationV1
      ? {
          revenueStreams: listRevenueStreams(),
          env: getMonetizationEnvSummary(),
          upsells: listUpsellOffers(),
        }
      : null;

  if (req.nextUrl.searchParams.get("analytics") === "1") {
    trackMonetizationPricingSnapshotRead({ monetization: Boolean(monetization) });
  }

  return NextResponse.json({
    ok: true,
    snapshot,
    monetization,
    disclaimers: snapshot.disclaimers,
  });
}
