import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const brokerId = user.role === "ADMIN" && typeof body.brokerId === "string" ? body.brokerId : userId;

  const expense = await prisma.brokerExpense.create({
    data: {
      brokerId,
      transactionRecordId: typeof body.transactionRecordId === "string" ? body.transactionRecordId : null,
      category: String(body.category ?? "other"),
      description: body.description ? String(body.description) : null,
      amountCents: Math.round(Number(body.amountCents ?? 0)),
      taxGstCents: Math.round(Number(body.taxGstCents ?? 0)),
      taxQstCents: Math.round(Number(body.taxQstCents ?? 0)),
      expenseDate: body.expenseDate ? new Date(String(body.expenseDate)) : new Date(),
      receiptUrl: body.receiptUrl ? String(body.receiptUrl) : null,
    },
  });

  return NextResponse.json({ ok: true, id: expense.id });
}

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.brokerExpense.findMany({
    where: { brokerId: userId },
    orderBy: { expenseDate: "desc" },
    take: 200,
  });
  return NextResponse.json({ expenses: rows });
}
