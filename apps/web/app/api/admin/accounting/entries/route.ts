import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFinanceActor } from "@/lib/admin/finance-request";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const actor = await getFinanceActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const entryType = searchParams.get("entryType") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const take = Math.min(500, Math.max(10, Number(searchParams.get("take") ?? "100")));

  const entries = await prisma.accountingEntry.findMany({
    where: {
      ...(entryType ? { entryType } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { entryDate: "desc" },
    take,
    include: { reconciliation: true },
  });

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const actor = await getFinanceActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const entryType = String(body.entryType ?? "");
  const category = String(body.category ?? "");
  const sourceType = body.sourceType != null ? String(body.sourceType) : null;
  const sourceId = body.sourceId != null ? String(body.sourceId) : null;
  const subtotalCents = Number(body.subtotalCents ?? 0);
  const gstCents = Number(body.gstCents ?? 0);
  const qstCents = Number(body.qstCents ?? 0);
  const totalCents = Number(body.totalCents ?? subtotalCents + gstCents + qstCents);
  const status = String(body.status ?? "completed");
  const notes = body.notes != null ? String(body.notes) : null;
  const entryDate = body.entryDate ? new Date(String(body.entryDate)) : new Date();

  if (!entryType || !category) {
    return NextResponse.json({ error: "entryType and category required" }, { status: 400 });
  }

  const entry = await prisma.accountingEntry.create({
    data: {
      entryType,
      category,
      sourceType,
      sourceId,
      subtotalCents: Math.round(subtotalCents),
      gstCents: Math.round(gstCents),
      qstCents: Math.round(qstCents),
      totalCents: Math.round(totalCents),
      status,
      notes,
      entryDate,
    },
  });

  await prisma.reconciliationRecord.create({
    data: {
      accountingEntryId: entry.id,
      status: "unreconciled",
    },
  });

  return NextResponse.json({ entry });
}
