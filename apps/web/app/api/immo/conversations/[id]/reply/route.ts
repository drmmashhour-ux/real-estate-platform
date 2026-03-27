import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isMortgageExpertRole } from "@/lib/marketplace/mortgage-role";
import { appendExpertChatMessage } from "@/lib/immo/process-crm-chat";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!isMortgageExpertRole(user?.role)) {
    return NextResponse.json({ error: "Experts only" }, { status: 403 });
  }

  let body: { content?: unknown };
  try {
    body = (await req.json()) as { content?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const content = typeof body.content === "string" ? body.content : "";
  if (!content.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });

  try {
    await appendExpertChatMessage({ conversationId: id, expertUserId: userId, content });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (m === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (m === "NOT_EXPERT") return NextResponse.json({ error: "Not an expert" }, { status: 403 });
    throw e;
  }
}
