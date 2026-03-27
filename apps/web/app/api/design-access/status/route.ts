import { getGuestId } from "@/lib/auth/session";
import { getDesignAccessStatus } from "@/lib/design-access";

export const dynamic = "force-dynamic";

/**
 * GET /api/design-access/status
 * Returns current design access status for the user (trial/expired/paid).
 */
export async function GET() {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({
        allowed: true,
        trialStart: null,
        trialEnd: null,
        isPaid: false,
        daysLeft: null,
      });
    }

    const status = await getDesignAccessStatus(userId);
    return Response.json(status ?? { allowed: true, trialStart: null, trialEnd: null, isPaid: false, daysLeft: null });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get design access status" }, { status: 500 });
  }
}
