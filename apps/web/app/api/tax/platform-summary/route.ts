import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { buildPlatformTaxSummary } from "@/lib/tax/summaries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = req.nextUrl;
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const from = fromStr ? new Date(fromStr) : new Date(new Date().getFullYear(), 0, 1);
  const to = toStr ? new Date(toStr) : new Date();

  const summary = await buildPlatformTaxSummary(from, to);
  const format = url.searchParams.get("format");

  if (format === "csv") {
    const lines = ["metric,value_cents", `taxableRevenue,${summary.totals.taxableRevenueCents}`, `gst,${summary.totals.gstCollectedCents}`, `qst,${summary.totals.qstCollectedCents}`];
    for (const [k, v] of Object.entries(summary.byPaymentType)) {
      lines.push(`type_${k}_amount,${v.amountCents}`);
    }
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="platform-tax-${from.toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json(summary);
}
