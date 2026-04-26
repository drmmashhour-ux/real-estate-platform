/**
 * Mobile — host payout summary (same data as web host API).
 */

import { resolveCheckoutUserId } from "@/lib/auth/resolve-checkout-user";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getHostPayoutSummary } from "@/modules/bnhub-payments/services/payoutControlService";
import { syncHostAccountFromUserStripe } from "@/modules/bnhub-payments/services/connectedAccountService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await resolveCheckoutUserId(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const listing = await prisma.shortTermListing.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  });
  if (!listing) return Response.json({ error: "Forbidden" }, { status: 403 });

  await syncHostAccountFromUserStripe(userId).catch(() => {});
  const payouts = await getHostPayoutSummary(userId);
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeOnboardingComplete: true },
  });

  return Response.json({
    stripeOnboardingComplete: me?.stripeOnboardingComplete ?? false,
    payouts,
  });
}
