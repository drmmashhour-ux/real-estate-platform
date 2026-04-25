import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { HostEarningsPage } from "@/components/host/HostEarningsPage";
import { prisma } from "@repo/db";
import { buildHostEarningsSnapshot } from "@/lib/host-earnings/dashboard";
import { getHostMonthlyPaymentTotals } from "@/lib/host-earnings/monthly-breakdown";
import { getResolvedMarket } from "@/lib/markets";
import { resolveActivePaymentModeFromMarket } from "@/lib/payments/resolve-payment-mode";

export const dynamic = "force-dynamic";

export default async function HostEarningsRoute() {
  const userId = await getGuestId();
  if (!userId) {
    redirect("/auth/login?next=/host/earnings");
  }

  const [snapshot, user, market, monthlyBreakdown] = await Promise.all([
    buildHostEarningsSnapshot(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { stripeAccountId: true, stripeOnboardingComplete: true },
    }),
    getResolvedMarket(),
    getHostMonthlyPaymentTotals(userId, 12),
  ]);

  const manualMarket = resolveActivePaymentModeFromMarket(market) === "manual";
  const connectIncomplete =
    Boolean(user?.stripeAccountId?.trim()) && !user?.stripeOnboardingComplete;

  return (
    <HostEarningsPage
      snapshot={snapshot}
      manualMarket={manualMarket}
      connectIncomplete={connectIncomplete}
      hasStripe={Boolean(user?.stripeAccountId?.trim())}
      monthlyBreakdown={monthlyBreakdown}
    />
  );
}
