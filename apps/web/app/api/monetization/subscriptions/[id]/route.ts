import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getSubscription, cancelSubscriptionAtPeriodEnd } from "@/lib/monetization";

/**
 * GET /api/monetization/subscriptions/:id
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { id } = await context.params;
    const subscription = await getSubscription(id);
    if (!subscription) return Response.json({ error: "Subscription not found" }, { status: 404 });
    if (subscription.userId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 });
    return Response.json(subscription);
  } catch (e) {
    return Response.json({ error: "Failed to load subscription" }, { status: 500 });
  }
}

/**
 * PATCH /api/monetization/subscriptions/:id – cancel at period end
 * Body: { cancel: true }
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { id } = await context.params;
    const subscription = await getSubscription(id);
    if (!subscription) return Response.json({ error: "Subscription not found" }, { status: 404 });
    if (subscription.userId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    if (body.cancel === true) {
      const updated = await cancelSubscriptionAtPeriodEnd(id);
      return Response.json(updated);
    }
    return Response.json(subscription);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update subscription";
    return Response.json({ error: message }, { status: 400 });
  }
}
