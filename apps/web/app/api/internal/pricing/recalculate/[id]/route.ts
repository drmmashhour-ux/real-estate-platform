import { NextRequest } from "next/server";
import {
  cronNotConfigured,
  cronUnauthorized,
  verifyCronBearer,
} from "@/lib/server/internal-cron-auth";
import { recalculatePricingBatch } from "@/src/modules/pricing/pricing.engine";
import { revenueV4Flags } from "@/config/feature-flags";
import { isReasonableListingId } from "@/lib/api/safe-params";

export const dynamic = "force-dynamic";

/**
 * POST /api/internal/pricing/recalculate/[id] — single listing batch (cron bearer only).
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();
  if (!revenueV4Flags.pricingEngineV1) {
    return Response.json({ ok: false, error: "Feature disabled" }, { status: 403 });
  }

  const { id: raw } = await context.params;
  const id = raw?.trim() ?? "";
  if (!isReasonableListingId(id)) {
    return Response.json({ ok: false, error: "Invalid id" }, { status: 400 });
  }

  const out = await recalculatePricingBatch({ listingIds: [id], limit: 1 });
  return Response.json({ ok: true, ...out });
}
