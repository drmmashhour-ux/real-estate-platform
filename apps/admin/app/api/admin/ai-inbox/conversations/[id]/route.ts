import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/ai-inbox/conversations/:id — status, assignee */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  let body: { status?: string; assignedToId?: string | null };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: { status?: string; assignedToId?: string | null } = {};
  if (body.status === "resolved" || body.status === "open" || body.status === "closed") {
    data.status = body.status;
  }
  if (body.assignedToId !== undefined) {
    data.assignedToId = body.assignedToId;
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "No valid fields" }, { status: 400 });
  }

  await prisma.growthAiConversation.update({
    where: { id },
    data:
      body.status === "resolved"
        ? { ...data, growthAiOutcome: "resolved", growthAiOutcomeAt: new Date() }
        : data,
  });

  if (body.status === "resolved") {
    await prisma.growthAiConversationHandoff.updateMany({
      where: { conversationId: id },
      data: { status: "resolved" },
    });
  }

  return Response.json({ ok: true });
}
