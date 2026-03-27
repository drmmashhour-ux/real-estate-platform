import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createSubscription } from "@/lib/monetization";

/**
 * POST /api/monetization/subscriptions
 * Body: { planId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const planId = body.planId;
    if (!planId || typeof planId !== "string") {
      return Response.json({ error: "planId required" }, { status: 400 });
    }

    const subscription = await createSubscription(userId, planId);
    return Response.json(subscription);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create subscription";
    return Response.json({ error: message }, { status: 400 });
  }
}
