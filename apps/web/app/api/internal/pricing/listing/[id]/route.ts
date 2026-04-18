import { NextRequest } from "next/server";
import {
  cronNotConfigured,
  cronUnauthorized,
  verifyCronBearer,
} from "@/lib/server/internal-cron-auth";
import { recommendFsboListingPrice } from "@/src/modules/pricing/pricing.engine";
import { toPricingEngineApiShape } from "@/src/modules/pricing/pricing.explainer";
import { revenueV4Flags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

/**
 * GET /api/internal/pricing/listing/[id] — FSBO pricing recommendation (Bearer CRON_SECRET).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(_request)) return cronUnauthorized();

  if (!revenueV4Flags.pricingEngineV1) {
    return Response.json({ ok: false, error: "FEATURE_PRICING_ENGINE_V1 disabled" }, { status: 403 });
  }

  const { id } = await context.params;
  const rec = await recommendFsboListingPrice(id);
  if (!rec) {
    return Response.json({ ok: false, error: "No recommendation (missing listing or engine off)" }, { status: 404 });
  }

  return Response.json({ ok: true, recommendation: toPricingEngineApiShape(rec) });
}
