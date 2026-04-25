/**
 * GET — host payout list (safe fields only).
 */

import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getHostPayoutSummary } from "@/modules/bnhub-payments/services/payoutControlService";
import { syncHostAccountFromUserStripe } from "@/modules/bnhub-payments/services/connectedAccountService";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      stripeAccountId: true,
      stripeOnboardingComplete: true,
    },
  });
  if (!me) return Response.json({ error: "Not found" }, { status: 404 });

  const hasListing =
    me.role === "ADMIN"
      ? true
      : Boolean(
          await prisma.shortTermListing.findFirst({
            where: { ownerId: userId },
            select: { id: true },
          })
        );
  const isHostContext = hasListing;
  if (!isHostContext && me.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await syncHostAccountFromUserStripe(userId).catch(() => {});

  const payouts = await getHostPayoutSummary(userId);

  return Response.json({
    onboarding: {
      stripeAccountPresent: Boolean(me.stripeAccountId),
      stripeOnboardingComplete: me.stripeOnboardingComplete,
    },
    payouts,
    wording: {
      holdExplanation:
        "A payout may show as held while the stay is upcoming, during review, or if there is a payment issue. This reflects internal payout timing policy, not a regulated escrow account unless separately disclosed.",
    },
  });
}
