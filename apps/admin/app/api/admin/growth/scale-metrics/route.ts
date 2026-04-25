import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { getBnhubScaleMetrics } from "@/lib/growth/bnhub-scale-metrics";
import { getDominationCityPerformance } from "@/lib/growth/bnhub-city-performance";
import { getNetworkEffectSnapshot } from "@/lib/growth/network-effects";
import { getTopSupplyCities, getUnderSuppliedCities } from "@/lib/growth/marketplace-balance";
import { getGrowthTrackingDashboard } from "@/modules/analytics/services/growth-tracking-dashboard";

export const dynamic = "force-dynamic";

/** Combined LECIPM traffic funnel + BNHUB marketplace liquidity for 10K scaling. */
export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  const admin = await requireAdminUser(userId);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const daysRaw = Number(new URL(req.url).searchParams.get("days") ?? "30");
  const days = Number.isFinite(daysRaw) ? Math.max(1, Math.min(180, Math.trunc(daysRaw))) : 30;
  const minSupply = Number(new URL(req.url).searchParams.get("minSupply") ?? "8");
  const minListings = Number.isFinite(minSupply) ? Math.max(1, Math.trunc(minSupply)) : 8;

  const [lecipm, bnhub, underSupplied, topSupply, dominationCities, networkEffects] = await Promise.all([
    getGrowthTrackingDashboard(days),
    getBnhubScaleMetrics(days),
    getUnderSuppliedCities(minListings),
    getTopSupplyCities(12),
    getDominationCityPerformance(days),
    getNetworkEffectSnapshot(),
  ]);

  const revenuePerGuestUserCents =
    bnhub.users.guestUsers > 0
      ? Math.round(bnhub.bookings.gmvCentsInPeriod / bnhub.users.guestUsers)
      : null;

  return NextResponse.json({
    rangeDays: days,
    lecipm,
    bnhub,
    marketplaceBalance: {
      underSuppliedCities: underSupplied,
      topSupplyCities: topSupply,
      minListingsPerCity: minListings,
    },
    domination: {
      cityPerformance: dominationCities,
      networkEffects,
      revenuePerGuestUserCents,
    },
  });
}
