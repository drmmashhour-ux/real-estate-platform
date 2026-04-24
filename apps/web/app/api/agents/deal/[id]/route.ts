import { NextResponse } from "next/server";
import { requireAgentsSession } from "@/app/api/agents/_auth";
import { runAgentsForDeal } from "@/modules/agents/agent-orchestrator.service";
import { assertUserCanAccessDeal } from "@/modules/agents/agent-access.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAgentsSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "DEAL_ID_REQUIRED" }, { status: 400 });
  }

  const ok = await assertUserCanAccessDeal(auth.userId, auth.role, id.trim());
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await runAgentsForDeal(id.trim(), auth.userId);
  if (!result) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(result);
}
