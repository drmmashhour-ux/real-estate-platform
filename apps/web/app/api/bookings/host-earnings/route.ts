import { loadHostEarningsPayload } from "@/lib/bookings/load-host-earnings-payload";
import { assertBnhubHostOrAdmin } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings/host-earnings — same auth as /api/host/earnings.
 */
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
  return Response.json({
    summary: payload.summary,
    recentPaid: payload.recentPaid,
    weeklyRevenue: payload.weeklyRevenue,
  });
}
