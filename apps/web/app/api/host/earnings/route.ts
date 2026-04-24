import { loadHostEarningsPayload } from "@/lib/bookings/load-host-earnings-payload";
import { getGuestId } from "@/lib/auth/session";
import { computeHostMonthlyRevenueCents } from "@/lib/host/compute-host-monthly-revenue";
import { requireBnhubHostAccess } from "@/lib/host/require-bnhub-host-access";
import { buildHostEarningsSnapshot } from "@/lib/host-earnings/dashboard";
import { getResolvedMarket } from "@/lib/markets";
import { resolveActivePaymentModeFromMarket } from "@/lib/payments/resolve-payment-mode";
import { getMobileAuthUser, resolveMobileAppRoleFromRequest } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

async function resolveHostEarningsActor(
  request: Request
): Promise<{ userId: string } | { error: string; status: number }> {
  const mobileUser = await getMobileAuthUser(request);
  if (mobileUser) {
    const role = await resolveMobileAppRoleFromRequest(request, mobileUser);
    if (role !== "host" && role !== "admin") {
      return { error: "Forbidden", status: 403 };
    }
    return { userId: mobileUser.id };
  }

  const sessionId = await getGuestId();
  const gate = await requireBnhubHostAccess(sessionId);
  if (!gate.ok) return { error: gate.error, status: gate.status };
  return { userId: gate.userId };
}

/** GET /api/host/earnings — Supabase guest-booking slice + Prisma BNHUB ledger snapshot. */
export async function GET(request: Request) {
  const actor = await resolveHostEarningsActor(request);
  if ("error" in actor) {
    return Response.json({ error: actor.error }, { status: actor.status });
  }
  const userId = actor.userId;

  const payload = await loadHostEarningsPayload(userId);
  if ("error" in payload) {
    return Response.json({ error: payload.error }, { status: payload.status });
  }

  const prismaBnhub = await buildHostEarningsSnapshot(userId);
  const monthlyRevenue = await computeHostMonthlyRevenueCents(userId);
  const market = await getResolvedMarket();
  const manualMarket = resolveActivePaymentModeFromMarket(market) === "manual";

  return Response.json({
    summary: payload.summary,
    recentPaid: payload.recentPaid,
    weeklyRevenue: payload.weeklyRevenue,
    prismaBnhub,
    monthlyRevenue,
    manualMarket,
    marketCode: market.code,
  });
}
