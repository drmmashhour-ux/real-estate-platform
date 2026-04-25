import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { getAiCloserLearningSnapshot } from "@/modules/ai-closer/ai-closer-learning.service";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const userId = await getGuestId();
  if (!userId) return null;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (u?.role !== "ADMIN") return null;
  return userId;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Admin only" }, { status: 403 });

  const learning = await getAiCloserLearningSnapshot();

  const topObjections = Object.entries(learning.objectionsCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key, count]) => ({ key, count }));

  const stages = Object.entries(learning.stagesCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([stage, count]) => ({ stage, count }));

  return Response.json({
    learning,
    topObjections,
    stages,
    feedNote: "Recommendations logged as LeadTimelineEvent AI_CLOSER_* rows.",
  });
}
