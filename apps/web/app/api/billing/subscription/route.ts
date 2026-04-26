import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/billing/subscription — signed-in user's subscription summary (server-only; no secrets).
 */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  try {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sellerPlan: true, plan: true },
  });

  const sub = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      planCode: true,
      status: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      stripeSubscriptionId: true,
    },
  });

  return Response.json({
    ok: true,
    sellerPlan: user?.sellerPlan ?? null,
    userPlan: user?.plan ?? null,
    workspaceSubscription: sub
      ? {
          planCode: sub.planCode,
          status: sub.status,
          currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          hasStripeSubscription: Boolean(sub.stripeSubscriptionId),
        }
      : null,
  });
  } catch (e) {
    logError("billing_subscription_get_failed", { userId, err: e });
    return Response.json({ error: "Unable to load billing" }, { status: 500 });
  }
}
