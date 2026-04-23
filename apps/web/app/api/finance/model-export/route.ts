import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { isFinancialStaff } from "@/lib/admin/finance-access";
import { getFullFinancialModel } from "@/modules/finance/investor-financial-model";

export const dynamic = "force-dynamic";

function csvEscape(s: string | number | null | undefined): string {
  const v = s == null ? "" : String(s);
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const allowed = user.role === PlatformRole.INVESTOR || isFinancialStaff(user.role);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "csv").toLowerCase();

  const model = await getFullFinancialModel();
  const { payload, monthlyCosts, yearlyCosts, profit, projections } = model;

  if (format === "pdf") {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 14;
    doc.setFontSize(14);
    doc.text("Platform financial model (operational estimate)", 14, y);
    y += 10;
    doc.setFontSize(10);
    doc.text(`Period: ${payload.period.label}`, 14, y);
    y += 6;
    doc.text(`Total revenue: $${(payload.totalRevenueCents / 100).toFixed(2)} CAD`, 14, y);
    y += 6;
    doc.text(`Modeled costs: $${(profit.costCents / 100).toFixed(2)} CAD`, 14, y);
    y += 6;
    doc.text(`Net: $${(profit.netProfitCents / 100).toFixed(2)} CAD`, 14, y);
    y += 10;
    doc.text("Revenue by source:", 14, y);
    y += 6;
    for (const r of payload.revenueBySource) {
      doc.text(`  ${r.label}: $${(r.totalCents / 100).toFixed(2)}`, 14, y);
      y += 5;
      if (y > 270) {
        doc.addPage();
        y = 14;
      }
    }
    y += 4;
    doc.text("Disclaimer: Not an audited financial statement.", 14, y);

    const buf = doc.output("arraybuffer");
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="financial-model.pdf"',
      },
    });
  }

  const lines: string[] = [];
  lines.push(["section", "key", "value1_cad", "value2_cad"].join(","));
  lines.push(["meta", "period", csvEscape(payload.period.label), ""].join(","));
  lines.push(["meta", "demo_mode", payload.demoMode ? "yes" : "no", ""].join(","));
  lines.push(["revenue", "total", (payload.totalRevenueCents / 100).toFixed(2), ""].join(","));
  for (const r of payload.revenueBySource) {
    lines.push(["revenue_by_source", r.source, (r.totalCents / 100).toFixed(2), ""].join(","));
  }
  lines.push(["costs", "hosting_monthly", (monthlyCosts.hostingCents / 100).toFixed(2), ""].join(","));
  lines.push(["costs", "ai_api_monthly", (monthlyCosts.aiApiCents / 100).toFixed(2), ""].join(","));
  lines.push(["costs", "marketing_monthly", (monthlyCosts.marketingCents / 100).toFixed(2), ""].join(","));
  lines.push(["costs", "team_monthly", (monthlyCosts.teamCents / 100).toFixed(2), ""].join(","));
  lines.push(["costs", "legal_ops_monthly", (monthlyCosts.legalOpsCents / 100).toFixed(2), ""].join(","));
  lines.push(["costs", "monthly_total", (monthlyCosts.totalCents / 100).toFixed(2), ""].join(","));
  lines.push(["costs", "yearly_total", (yearlyCosts.totalCents / 100).toFixed(2), ""].join(","));
  lines.push(["profit", "revenue", (profit.revenueCents / 100).toFixed(2), ""].join(","));
  lines.push(["profit", "costs_applied", (profit.costCents / 100).toFixed(2), ""].join(","));
  lines.push(["profit", "net", (profit.netProfitCents / 100).toFixed(2), ""].join(","));
  for (const p of projections) {
    lines.push(
      [
        "projection",
        csvEscape(p.label),
        (p.projectedRevenueCents / 100).toFixed(2),
        (p.projectedProfitCents / 100).toFixed(2),
      ].join(",")
    );
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="financial-model.csv"',
    },
  });
}
