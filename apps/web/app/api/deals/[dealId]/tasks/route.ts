import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { canAccessPipelineDeal, requireAuthUser, requireBrokerOrAdmin } from "@/lib/deals/guard-pipeline-deal";
import { getDealById } from "@/modules/deals/deal.service";
import { createTask, listTasks } from "@/modules/deals/deal-diligence.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { dealId } = await context.params;

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tasks = await listTasks(dealId);
    return NextResponse.json({ tasks });
  } catch (e) {
    logError("[api.deals.tasks.get]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  if (!requireBrokerOrAdmin(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { dealId } = await context.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const row = await createTask(
      dealId,
      {
        title: typeof body.title === "string" ? body.title : "",
        description: typeof body.description === "string" ? body.description : null,
        category: typeof body.category === "string" ? body.category : "OTHER",
        priority: typeof body.priority === "string" ? body.priority : null,
        ownerUserId: typeof body.ownerUserId === "string" ? body.ownerUserId : null,
        dueDate:
          typeof body.dueDate === "string" && body.dueDate ? new Date(body.dueDate) : null,
        linkedConditionId:
          typeof body.linkedConditionId === "string" ? body.linkedConditionId : null,
      },
      auth.userId
    );
    return NextResponse.json({ task: row });
  } catch (e) {
    logError("[api.deals.tasks.post]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
