import { AiSuggestionStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const row = await prisma.aiSuggestion.findUnique({ where: { id } });
  if (!row || row.hostId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.aiSuggestion.update({
    where: { id },
    data: { status: AiSuggestionStatus.DISMISSED },
  });
  return Response.json({ ok: true });
}
