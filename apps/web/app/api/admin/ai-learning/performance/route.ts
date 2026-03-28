import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { derivedRates, weightedScore } from "@/src/modules/messaging/learning/templatePerformance";

export const dynamic = "force-dynamic";

/** GET — template performance leaderboard for admin learning dashboard */
export async function GET() {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.growthAiTemplatePerformance.findMany({
    orderBy: [{ sentCount: "desc" }],
    take: 200,
  });

  const leaderboard = rows.map((r) => {
    const rates = derivedRates(r);
    return {
      templateKey: r.templateKey,
      stage: r.stage,
      detectedIntent: r.detectedIntent,
      detectedObjection: r.detectedObjection,
      highIntent: r.highIntent,
      sent: r.sentCount,
      ...rates,
      weightedScore: weightedScore(r),
    };
  });

  const experimentDecisions = await prisma.growthAiConversationDecision.groupBy({
    by: ["experimentKey", "selectedTemplateKey"],
    where: { wasExperiment: true, NOT: { experimentKey: null } },
    _count: { id: true },
  });

  return Response.json({ leaderboard, experimentDecisions });
}
