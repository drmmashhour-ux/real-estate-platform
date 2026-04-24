import { NextResponse } from "next/server";
import { approveAndExecuteTask, executeTask } from "@/modules/lecipm-autonomous-execution/autonomous-execution.engine";
import { requireExecutionActor } from "@/modules/lecipm-autonomous-execution/execution-api-guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireExecutionActor();
  if (!actor.ok) return actor.response;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const withApprove = body?.approveFirst === true;

  const result = withApprove ? await approveAndExecuteTask(id, actor.userId) : await executeTask(id, { actorUserId: actor.userId, auto: false });
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
