import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const viewerId = await getGuestId();
  if (!viewerId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const viewer = await prisma.user.findUnique({ where: { id: viewerId }, select: { role: true } });
  if (viewer?.role !== "ADMIN" && viewer?.role !== "BROKER") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return Response.json({ error: "Not found" }, { status: 404 });

  if (viewer.role === "BROKER") {
    const shared =
      lead.leadSource === "evaluation_lead" || lead.leadSource === "broker_consultation";
    const ok =
      lead.introducedByBrokerId === viewerId ||
      lead.lastFollowUpByBrokerId === viewerId ||
      shared;
    if (!ok) return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const [events, messages] = await Promise.all([
    prisma.leadTimelineEvent.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
    prisma.leadCommMessage.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
  ]);

  return Response.json({ events, messages });
}
