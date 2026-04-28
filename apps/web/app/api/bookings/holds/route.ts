import { requireAdminSession } from "@/lib/admin/require-admin";
import { getListingsDB } from "@/lib/db/routeSwitch";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getClientIpFromRequest } from "@/lib/security/ip-fingerprint";
import { trackEvent } from "@/src/services/analytics";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings/holds — **admin** marketplace pending holds with future `expiresAt` (Order 57.1).
 */
export async function GET(req: Request) {
  const ip = getClientIpFromRequest(req);
  const rl = checkRateLimit(`bookings-holds-get:${ip}`, { windowMs: 60_000, max: 30 });
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "content-type": "application/json", ...getRateLimitHeaders(rl) },
    });
  }
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ error: admin.error }, { status: admin.status });
  }

  const now = new Date();
  const listDb = getListingsDB();
  const [holds, totalPending, totalExpiredHistorical] = await Promise.all([
    listDb.booking.findMany({
      where: { status: "pending", expiresAt: { gt: now } },
      orderBy: { expiresAt: "asc" },
      take: 200,
      select: {
        id: true,
        listingId: true,
        userId: true,
        startDate: true,
        endDate: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
    listDb.booking.count({ where: { status: "pending", expiresAt: { gt: now } } }),
    listDb.booking.count({ where: { status: "expired" } }),
  ]);

  const confirmed = await listDb.booking.count({ where: { status: "confirmed" } }).catch(() => 0);
  void trackEvent("booking_holds_metrics_viewed", { active: totalPending, confirmed }).catch(() => {});

  return Response.json({
    holds: holds.map((h) => ({
      id: h.id,
      listingId: h.listingId,
      userId: h.userId,
      startDate: h.startDate.toISOString().slice(0, 10),
      endDate: h.endDate.toISOString().slice(0, 10),
      status: h.status,
      expiresAt: h.expiresAt?.toISOString() ?? null,
      createdAt: h.createdAt.toISOString(),
    })),
    metrics: {
      activePendingHolds: totalPending,
      /** Rough lifetime counter — not "today only". */
      expiredHoldsCount: totalExpiredHistorical,
      confirmedBookings: confirmed,
    },
  });
}
