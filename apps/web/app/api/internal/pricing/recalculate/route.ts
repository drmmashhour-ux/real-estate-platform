import { NextRequest } from "next/server";
import {
  cronNotConfigured,
  cronUnauthorized,
  verifyCronBearer,
} from "@/lib/server/internal-cron-auth";
import { recalculatePricingBatch } from "@/src/modules/pricing/pricing.engine";
import { revenueV4Flags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

/**
 * POST /api/internal/pricing/recalculate — batch pricing hints (Bearer CRON_SECRET). Does not mutate list prices.
 */
export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();

  const body = (await request.json().catch(() => ({}))) as {
    limit?: number;
    listingIds?: string[];
  };

  if (!revenueV4Flags.pricingEngineV1) {
    return Response.json({ ok: false, error: "FEATURE_PRICING_ENGINE_V1 disabled" }, { status: 403 });
  }

  const out = await recalculatePricingBatch({
    limit: body.limit,
    listingIds: body.listingIds,
  });

  return Response.json({
    ok: true,
    flags: { pricingEngineV1: revenueV4Flags.pricingEngineV1 },
    ...out,
  });
}
