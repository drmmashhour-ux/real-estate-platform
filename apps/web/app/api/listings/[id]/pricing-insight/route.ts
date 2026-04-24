import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { recommendFsboListingPrice, persistFsboPricingAdviceSnapshot } from "@/src/modules/pricing/pricing.engine";
import { toPricingEngineApiShape } from "@/src/modules/pricing/pricing.explainer";
import { revenueV4Flags } from "@/config/feature-flags";
import { isReasonableListingId } from "@/lib/api/safe-params";
import { logInfo, logWarn } from "@/lib/logger";
import { syncFsboListingMetrics } from "@/src/modules/listings/syncFsboListingMetrics";
import { trackFunnelEvent } from "@/lib/funnel/tracker";
import { assertBrokeredTransaction } from "@/modules/legal-boundary/compliance-action-guard";
import { getOrSyncTransactionContext } from "@/modules/legal-boundary/transaction-context.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/listings/[id]/pricing-insight — FSBO owner/admin; persists snapshot to SellerPricingAdvice when enabled.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = rawId?.trim() ?? "";
  if (!isReasonableListingId(id)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  try {
    const listing = await prisma.fsboListing.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    if (!listing) return Response.json({ error: "Not found" }, { status: 404 });

    const admin = await isPlatformAdmin(userId);
    if (listing.ownerId !== userId && !admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!revenueV4Flags.pricingEngineV1) {
      return Response.json({ ok: false, error: "Feature disabled" }, { status: 403 });
    }

    const txCtx = await getOrSyncTransactionContext({ entityType: "LISTING", entityId: id });
    const boundary = await assertBrokeredTransaction(txCtx, "advanced_pricing_recommendation", userId, {
      auditAllowSuccess: true,
    });
    if (boundary) return boundary;

    const rec = await recommendFsboListingPrice(id);
    if (!rec) {
      return Response.json({ ok: false, error: "Unavailable" }, { status: 404 });
    }
    await persistFsboPricingAdviceSnapshot(id, rec).catch(() => null);
    void syncFsboListingMetrics(id).catch(() => null);
    void trackFunnelEvent("pricing_view", { listingId: id, admin });

    logInfo("[pricing-insight] served", { listingId: id, admin });

    return Response.json({ ok: true, insight: toPricingEngineApiShape(rec) });
  } catch (e) {
    logWarn("[pricing-insight] error", { message: e instanceof Error ? e.message : "unknown" });
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
