import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const brokerId = await getGuestId();
  if (!brokerId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const viewer = await prisma.user.findUnique({ where: { id: brokerId }, select: { role: true } });
  if (viewer?.role !== "BROKER" && viewer?.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const leadWhere =
    viewer.role === "ADMIN"
      ? {}
      : {
          OR: [{ introducedByBrokerId: brokerId }, { lastFollowUpByBrokerId: brokerId }],
        };

  const baseLeads = await prisma.lead.findMany({
    where: leadWhere,
    select: { id: true, score: true, aiTier: true, pipelineStatus: true, optedOutOfFollowUp: true },
  });
  const ids = baseLeads.map((l) => l.id);
  if (ids.length === 0) {
    return Response.json({
      hotNeedingCallback: 0,
      aiContacted: 0,
      awaitingHuman: 0,
      voiceQueued: 0,
      totalLeads: 0,
    });
  }

  const hotNeedingCallback = baseLeads.filter(
    (l) =>
      !l.optedOutOfFollowUp &&
      (l.aiTier === "hot" || l.score >= 75) &&
      ["new", "contacted", "awaiting_reply"].includes(l.pipelineStatus)
  ).length;

  const aiContacted = await prisma.leadCommMessage.groupBy({
    by: ["leadId"],
    where: { leadId: { in: ids }, direction: "outbound" },
  });

  const awaitingHuman = baseLeads.filter((l) => l.pipelineStatus === "awaiting_reply").length;

  const voiceQueued = await prisma.leadCommMessage.count({
    where: {
      leadId: { in: ids },
      channel: "voice",
      status: "queued",
    },
  });

  return Response.json({
    hotNeedingCallback,
    aiContactedCount: aiContacted.length,
    awaitingHuman,
    voiceQueued,
    totalLeads: baseLeads.length,
  });
}
