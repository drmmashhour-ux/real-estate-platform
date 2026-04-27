import { getReferralStatsForUser } from "@/lib/growth/referral";
import { getGuestId } from "@/lib/auth/session";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";
import { logError } from "@/lib/monitoring/errorLogger";

export const dynamic = "force-dynamic";

/**
 * GET /api/growth/referral/stats — public code + count for the signed-in guest/user.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const id = (await getGuestId().catch(() => null)) ?? null;
    if (!id) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    const s = await getReferralStatsForUser(id);
    return Response.json(
      { code: s.code, totalReferrals: s.totalReferrals },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    logError(e, { route: "/api/growth/referral/stats" });
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
