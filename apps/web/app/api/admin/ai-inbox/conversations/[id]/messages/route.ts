import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/admin/ai-inbox/conversations/:id/messages */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const messages = await prisma.growthAiConversationMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({
    messages: messages.map((m) => ({
      id: m.id,
      senderType: m.senderType,
      messageText: m.messageText,
      detectedIntent: m.detectedIntent,
      detectedObjection: m.detectedObjection,
      confidence: m.confidence,
      handoffRequired: m.handoffRequired,
      templateKey: m.templateKey,
      ctaType: m.ctaType,
      isNudge: m.isNudge,
      isAssistClose: m.isAssistClose,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
