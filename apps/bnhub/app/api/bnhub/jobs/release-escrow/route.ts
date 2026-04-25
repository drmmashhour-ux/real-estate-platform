import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { releaseEscrowPayoutsDue } from "@/lib/trust-safety/escrow";

/**
 * POST /api/bnhub/jobs/release-escrow
 * Release escrow holds for payments whose release time has passed (e.g. 48h after check-in).
 * Protect with cron secret or admin in production.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    const body = await request.json().catch(() => ({}));
    const secret = process.env.CRON_SECRET;
    if (!userId && (!secret || body.secret !== secret)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await releaseEscrowPayoutsDue();
    return Response.json({ success: true, releasedCount: count });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to release escrow" }, { status: 500 });
  }
}
