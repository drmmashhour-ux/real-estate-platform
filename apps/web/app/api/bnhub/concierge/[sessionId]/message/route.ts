import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { sendMessageToConcierge } from "@/src/modules/bnhub-hospitality/services/conciergeAIService";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { sessionId } = await params;
  const session = await prisma.bnhubConciergeSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json()) as { text?: string };
  if (!body.text?.trim()) return Response.json({ error: "text required" }, { status: 400 });
  const reply = await sendMessageToConcierge({ sessionId, userId, text: body.text.trim() });
  return Response.json({ reply });
}
