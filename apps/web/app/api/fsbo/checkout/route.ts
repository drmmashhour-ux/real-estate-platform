import { getGuestId } from "@/lib/auth/session";
import { startFsboListingPublishCheckout } from "@/lib/fsbo/publish-checkout";
import { requireCheckoutRailsOpen } from "@/lib/payment-readiness/route-guards";

export const dynamic = "force-dynamic";

/**
 * POST /api/fsbo/checkout — JSON { listingId, plan?: "basic" | "premium" }
 * Creates Stripe Checkout (or free publish in dev). Prefer this over calling /api/stripe/checkout directly.
 */
export async function POST(request: Request) {
  const railBlock = requireCheckoutRailsOpen();
  if (railBlock) return railBlock;

  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) {
    return Response.json({ error: "listingId required" }, { status: 400 });
  }

  const result = await startFsboListingPublishCheckout(userId, listingId, body.plan);

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  if ("freePublish" in result && result.freePublish) {
    return Response.json({ ok: true, freePublish: true });
  }
  if ("url" in result) {
    return Response.json({ url: result.url });
  }
  return Response.json({ error: "Unexpected checkout response" }, { status: 500 });
}
