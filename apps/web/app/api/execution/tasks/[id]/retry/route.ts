import { NextResponse } from "next/server";
import { retryTask } from "@/modules/lecipm-autonomous-execution/autonomous-execution.engine";
import { requireExecutionActor } from "@/modules/lecipm-autonomous-execution/execution-api-guard";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireExecutionActor();
  if (!actor.ok) return actor.response;

  const { id } = await ctx.params;
  const result = await retryTask(id, actor.userId);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
