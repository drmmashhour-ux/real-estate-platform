import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { updateOutcome } from "@/src/modules/messaging/outcomes";

export const dynamic = "force-dynamic";

/** POST /api/admin/ai-inbox/conversations/:id/reply — human message + takeover */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return Response.json({ error: "text required" }, { status: 400 });

  const conv = await prisma.growthAiConversation.findUnique({ where: { id } });
  if (!conv) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.growthAiConversationMessage.create({
      data: {
        conversationId: id,
        senderType: "human",
        messageText: text,
      },
    }),
    prisma.growthAiConversation.update({
      where: { id },
      data: {
        humanTakeoverAt: new Date(),
        lastHumanMessageAt: new Date(),
        aiReplyPending: false,
        assignedToId: uid,
        growthAiOutcome: "human_takeover",
        growthAiOutcomeAt: new Date(),
      },
    }),
    prisma.growthAiConversationHandoff.updateMany({
      where: { conversationId: id, status: "pending" },
      data: { status: "claimed" },
    }),
  ]);

  await updateOutcome(id, "handoff");

  return Response.json({ ok: true });
}
