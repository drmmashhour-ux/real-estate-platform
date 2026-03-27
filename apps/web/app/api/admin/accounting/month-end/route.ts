import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFinanceActor } from "@/lib/admin/finance-request";
import { aggregateMonthEnd } from "@/lib/accounting/summary";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const actor = await getFinanceActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);

  const entries = await prisma.accountingEntry.findMany({
    where: {
      entryDate: {
        gte: new Date(year, month - 1, 1),
        lte: new Date(year, month, 0, 23, 59, 59, 999),
      },
    },
  });

  const summary = aggregateMonthEnd(entries, year, month);
  return NextResponse.json({ summary });
}
