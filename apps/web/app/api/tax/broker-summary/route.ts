import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { buildBrokerTaxSummary } from "@/lib/tax/summaries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = req.nextUrl;
  const brokerIdParam = url.searchParams.get("brokerId");
  const year = Number(url.searchParams.get("year") ?? new Date().getFullYear());
  const format = url.searchParams.get("format");

  const targetBrokerId = user.role === "ADMIN" && brokerIdParam ? brokerIdParam : userId;
  if (user.role !== "ADMIN" && brokerIdParam && brokerIdParam !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const summary = await buildBrokerTaxSummary(targetBrokerId, year);

  if (format === "csv") {
    const lines = [
      "section,key,value_cents",
      `totals,grossCommissions,${summary.totals.grossCommissionsCents}`,
      `totals,platformCommissions,${summary.totals.platformCommissionsCents}`,
      `totals,expenses,${summary.totals.expensesCents}`,
      `totals,gstOnExpenses,${summary.totals.gstOnExpensesCents}`,
      `totals,qstOnExpenses,${summary.totals.qstOnExpensesCents}`,
      `totals,netBrokerIncomeEstimate,${summary.totals.netBrokerIncomeEstimateCents}`,
      `totals,lostTransactionCosts,${summary.totals.lostTransactionCostsCents}`,
      `totals,lostTransactionCount,${summary.totals.lostTransactionCount}`,
    ];
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="broker-tax-summary-${targetBrokerId}-${year}.csv"`,
      },
    });
  }

  return NextResponse.json(summary);
}
