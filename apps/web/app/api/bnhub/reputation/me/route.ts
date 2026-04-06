import { getGuestId } from "@/lib/auth/session";
import { listSnapshotsForUser } from "@/src/modules/reviews/reputationMonthlyService";

/** GET — Signed-in user: monthly reputation snapshots (guest + host medians, top-performer flags). */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const snapshots = await listSnapshotsForUser(userId, 36);
  return Response.json({ snapshots });
}
