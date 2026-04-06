import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { analyzeConversation, type ConversationMessageInput } from "@/src/modules/deal-assistant/dealAssistantEngine";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/ai-inbox/conversations/:id/deal-assistant
 * Body: { persist?: boolean } — runs heuristic analysis; optionally stores DealAssistantInsight.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id: conversationId } = await ctx.params;
  let persist = false;
  try {
    const body = (await req.json()) as { persist?: boolean };
    persist = body?.persist === true;
  } catch {
    persist = false;
  }

  const convo = await prisma.growthAiConversation.findUnique({
    where: { id: conversationId },
    select: { id: true },
  });
  if (!convo) return Response.json({ error: "Not found" }, { status: 404 });

  const rows = await prisma.growthAiConversationMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: {
      senderType: true,
      messageText: true,
      createdAt: true,
    },
  });

  const messages: ConversationMessageInput[] = rows.map((m) => ({
    senderType: m.senderType,
    messageText: m.messageText,
    createdAt: m.createdAt,
  }));

  const analysis = analyzeConversation(messages);

  let savedId: string | null = null;
  if (persist) {
    const row = await prisma.dealAssistantInsight.create({
      data: {
        conversationId,
        detectedIntent: analysis.detectedIntent,
        detectedObjection: analysis.detectedObjection,
        urgencyLevel: analysis.urgencyLevel,
        recommendedAction: analysis.recommendedAction,
        messageSuggestion: analysis.messageSuggestion,
        confidence: analysis.confidence,
      },
    });
    savedId = row.id;
  }

  return Response.json({
    ...analysis,
    insightId: savedId,
    messageCount: messages.length,
  });
}
