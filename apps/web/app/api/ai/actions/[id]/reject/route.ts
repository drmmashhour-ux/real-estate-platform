import { AiAutopilotActionStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const action = await prisma.aiAutopilotAction.findUnique({ where: { id } });
  if (!action || action.hostId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.aiAutopilotAction.update({
    where: { id },
    data: { status: AiAutopilotActionStatus.REJECTED, reviewedAt: new Date() },
  });
  return Response.json({ ok: true });
}
