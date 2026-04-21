import { NextRequest, NextResponse } from "next/server";
import { approveExecutiveTask } from "@/modules/agents/executive-approval.service";
import { prisma } from "@/lib/db";
import { requireAgentsSession } from "../../../_auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ taskId: string }> }) {
  const auth = await requireAgentsSession();
  if (!auth.ok) return auth.response;

  const { taskId } = await ctx.params;
  const task = await prisma.executiveTask.findFirst({
    where: { id: taskId, ownerUserId: auth.userId },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const rationale = typeof body?.rationale === "string" ? body.rationale : null;

  await approveExecutiveTask({ taskId, actorUserId: auth.userId, rationale });
  return NextResponse.json({ ok: true });
}
