import { getGuestId } from "@/lib/auth/session";
import { getOrCreateDesignAccess, getDesignAccessStatus, isAccessAllowed } from "@/lib/design-access";

export const dynamic = "force-dynamic";

/**
 * POST /api/design-access/ensure
 * When user clicks design: if no DesignAccess record, create 7-day trial.
 * Returns current status (allowed, trialEnd, isPaid, daysLeft).
 */
export async function POST() {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json(
        { allowed: true, trialStart: null, trialEnd: null, isPaid: false, daysLeft: null },
        { status: 200 }
      );
    }

    const { access } = await getOrCreateDesignAccess(userId);
    if (!access) {
      return Response.json(
        { allowed: true, trialStart: null, trialEnd: null, isPaid: false, daysLeft: null },
        { status: 200 }
      );
    }
    const allowed = isAccessAllowed(access.trialEnd, access.isPaid);
    const daysLeft = allowed
      ? Math.max(0, Math.ceil((access.trialEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
      : 0;

    return Response.json({
      allowed,
      trialStart: access.trialStart.toISOString(),
      trialEnd: access.trialEnd.toISOString(),
      isPaid: access.isPaid,
      daysLeft,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to ensure design access" }, { status: 500 });
  }
}
