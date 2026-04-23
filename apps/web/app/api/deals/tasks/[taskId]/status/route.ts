import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { prisma } from "@repo/db";
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { getDealById } from "@/modules/deals/deal.service";
import { updateTaskStatus } from "@/modules/deals/deal-diligence.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ taskId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { taskId } = await context.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const status = typeof body.status === "string" ? body.status : "";

  if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });

  try {
    const task = await prisma.lecipmPipelineDealDiligenceTask.findUnique({ where: { id: taskId } });
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const deal = await getDealById(task.dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const row = await updateTaskStatus(taskId, status, auth.userId);
    return NextResponse.json({ task: row });
  } catch (e) {
    logError("[api.deals.task.status]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
