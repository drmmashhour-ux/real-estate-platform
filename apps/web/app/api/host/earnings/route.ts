import { loadHostEarningsPayload } from "@/lib/bookings/load-host-earnings-payload";
import { assertBnhubHostOrAdmin } from "@/lib/mobile/mobileAuth";
import { buildHostEarningsSnapshot } from "@/lib/host-earnings/dashboard";
import { getResolvedMarket } from "@/lib/markets";
import { resolveActivePaymentModeFromMarket } from "@/lib/payments/resolve-payment-mode";

export const dynamic = "force-dynamic";

/** GET /api/host/earnings — Supabase guest-booking slice + Prisma BNHub ledger snapshot. */
export async function GET(request: Request) {
  let userId: string;
  try {
    const u = await assertBnhubHostOrAdmin(request);
    userId = u.id;
  } catch (e) {
    const st = (e as Error & { status?: number }).status ?? 401;
    return Response.json({ error: st === 403 ? "Forbidden" : "Unauthorized" }, { status: st });
  }

  const payload = await loadHostEarningsPayload(userId);
  if ("error" in payload) {
    return Response.json({ error: payload.error }, { status: payload.status });
  }

  const prismaBnhub = await buildHostEarningsSnapshot(userId);
  const market = await getResolvedMarket();
  const manualMarket = resolveActivePaymentModeFromMarket(market) === "manual";

  return Response.json({
    summary: payload.summary,
    recentPaid: payload.recentPaid,
    weeklyRevenue: payload.weeklyRevenue,
    prismaBnhub,
    manualMarket,
    marketCode: market.code,
  });
}
