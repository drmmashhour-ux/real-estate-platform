import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { updateHostPerformance } from "@/src/modules/reviews/aggregationService";
import { getHostBadges } from "@/src/modules/reviews/badgeService";

/** GET /api/hosts/:id/performance — host trust score, response stats, badges (host user id = :id). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hostId } = await params;
    let performance = await prisma.hostPerformance.findUnique({ where: { hostId } });
    if (!performance) {
      performance = await updateHostPerformance(hostId);
    }
    const badges = await getHostBadges(hostId);
    return Response.json({ performance, badges });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load host performance" }, { status: 500 });
  }
}
