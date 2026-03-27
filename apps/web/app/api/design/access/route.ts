import { getGuestId } from "@/lib/auth/session";
import { getOrCreateDesignAccess } from "@/lib/design-access";
import { getDesignAccessStatus, getDaysRemaining } from "@/lib/design/access";

export const dynamic = "force-dynamic";

/**
 * GET /api/design/access
 * If no DesignAccess record for user → create 7-day trial.
 * Returns: { status: "no-trial" | "active" | "expired" | "paid", daysRemaining: number | null }
 */
export async function GET() {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({
        status: "no-trial",
        daysRemaining: null,
      });
    }

    const { access } = await getOrCreateDesignAccess(userId);
    if (!access) {
      return Response.json({
        status: "no-trial",
        daysRemaining: null,
      });
    }
    const status = getDesignAccessStatus({
      trialEnd: access.trialEnd,
      isPaid: access.isPaid,
    });
    const daysRemaining = getDaysRemaining({
      trialEnd: access.trialEnd,
      isPaid: access.isPaid,
    });

    return Response.json({
      status,
      daysRemaining,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { status: "no-trial", daysRemaining: null },
      { status: 200 }
    );
  }
}
