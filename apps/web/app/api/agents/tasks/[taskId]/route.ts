import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgentsSession } from "../../_auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ taskId: string }> }) {
  const auth = await requireAgentsSession();
  if (!auth.ok) return auth.response;

  const { taskId } = await ctx.params;
  const task = await prisma.executiveTask.findFirst({
    where: { id: taskId, ownerUserId: auth.userId },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}
