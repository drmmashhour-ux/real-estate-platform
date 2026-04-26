import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { userCanAccessCapitalModule, userCanMutateCapitalData } from "@/modules/capital/capital-access";
import { createFinancingCondition } from "@/modules/capital/financing-conditions.service";

export const dynamic = "force-dynamic";

const TAG = "[financing-condition]";

export async function GET(_request: NextRequest, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  if (!(await userCanAccessCapitalModule(userId, dealId))) {
    logInfo(`${TAG}`, { denied: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const conditions = await prisma.investmentPipelineFinancingCondition.findMany({
    where: { pipelineDealId: dealId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ conditions });
}

export async function POST(request: NextRequest, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  if (!(await userCanMutateCapitalData(userId, dealId))) {
    logInfo(`${TAG}`, { denied: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  if (!title || !category) return NextResponse.json({ error: "title and category required" }, { status: 400 });

  try {
    const row = await createFinancingCondition({
      pipelineDealId: dealId,
      actorUserId: userId,
      title,
      category,
      description: typeof body.description === "string" ? body.description : null,
      priority: typeof body.priority === "string" ? body.priority : null,
      status: typeof body.status === "string" ? body.status : undefined,
      dueDate:
        typeof body.dueDate === "string" && body.dueDate ? new Date(body.dueDate) : null,
      ownerUserId: typeof body.ownerUserId === "string" ? body.ownerUserId : null,
      offerId: typeof body.offerId === "string" ? body.offerId : null,
      notes: typeof body.notes === "string" ? body.notes : null,
    });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
