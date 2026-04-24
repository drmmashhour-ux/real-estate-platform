import { NextResponse } from "next/server";
import { requireExecutionActor } from "@/modules/lecipm-autonomous-execution/execution-api-guard";
import { markOpportunityReviewed } from "@/modules/opportunity-discovery/opportunity-actions.service";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await requireExecutionActor();
  if (!actor.ok) return actor.response;

  const { id } = await ctx.params;
  const r = await markOpportunityReviewed(id, actor.userId, actor.userId);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 404 });
  return NextResponse.json({ success: true });
}
