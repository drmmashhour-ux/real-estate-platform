import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { inviteGuest, inviteHost } from "@/lib/bnhub/referral-invite";

/**
 * POST /api/bnhub/referrals/invite
 * Body: { "type": "host" | "guest" } — creates referral code; rewards use BNHub-specific programs when present.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as { type?: string };
    const ref =
      body.type === "guest" ? await inviteGuest(userId) : await inviteHost(userId);
    return Response.json({
      code: ref.code,
      rewardCreditsCents: ref.rewardCreditsCents,
      type: body.type === "guest" ? "guest" : "host",
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create invite" }, { status: 500 });
  }
}
