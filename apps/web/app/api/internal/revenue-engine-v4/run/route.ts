import { NextRequest } from "next/server";
import { cronNotConfigured, cronUnauthorized, verifyCronBearer } from "@/lib/server/internal-cron-auth";
import { prioritizeRevenueOpportunities } from "@/src/modules/revenue/revenue.engine";
import { runBnhubNightlyPricingSuggestionsBatch } from "@/src/modules/pricing/bnhub-pricing-v4.service";
import { revenueV4Flags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

/**
 * POST /api/internal/revenue-engine-v4/run — batch hints (cron). Does not mutate listing prices.
 */
export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();
  void request;

  const [prioritized, bnhubBatch] = await Promise.all([
    prioritizeRevenueOpportunities(30),
    runBnhubNightlyPricingSuggestionsBatch(40),
  ]);

  return Response.json({
    ok: true,
    flags: revenueV4Flags,
    prioritizedCount: prioritized.length,
    bnhubPricingProfilesRefreshed: bnhubBatch.processed,
  });
}
