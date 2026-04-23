import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { findDealForClosingAccess } from "@/modules/closing/closing-access";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { appendClosingAudit } from "@/modules/closing/closing-audit";
import { syncDealClosingReadiness } from "@/modules/closing/closing-orchestrator";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const deal = await findDealForClosingAccess(dealId, userId, user?.role);
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const checklist = await prisma.dealClosingChecklist.findMany({
    where: { dealId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ checklist });
}

export async function POST(request: NextRequest, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  const deal = await findDealForClosingAccess(dealId, userId, user?.role);
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canMutateExecution(userId, user?.role, deal)) {
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

  const row = await prisma.dealClosingChecklist.create({
    data: {
      dealId,
      title,
      category,
      priority: typeof body.priority === "string" ? body.priority : null,
      status: typeof body.status === "string" ? body.status : "OPEN",
      notes: typeof body.notes === "string" ? body.notes : null,
    },
    select: { id: true },
  });

  await appendClosingAudit({
    dealId,
    actorUserId: userId,
    eventType: "CHECKLIST_UPDATED",
    note: `Added: ${title}`,
    metadataJson: { itemId: row.id },
  });
  await syncDealClosingReadiness(dealId);

  return NextResponse.json({ ok: true, id: row.id });
}
