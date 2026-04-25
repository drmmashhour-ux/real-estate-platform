import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getFinanceActor } from "@/lib/admin/finance-request";
import { aggregateMonthEnd } from "@/lib/accounting/summary";

export const dynamic = "force-dynamic";

function csvEscape(s: string | number | null | undefined): string {
  const v = s == null ? "" : String(s);
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET(request: NextRequest) {
  const actor = await getFinanceActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "csv").toLowerCase();
  const type = (searchParams.get("type") ?? "ledger").toLowerCase();
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);

  if (type === "month" && format === "csv") {
    const entries = await prisma.accountingEntry.findMany({
      where: {
        entryDate: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0, 23, 59, 59, 999),
        },
      },
      orderBy: { entryDate: "asc" },
      include: { reconciliation: true },
    });
    const summary = aggregateMonthEnd(entries, year, month);
    const header = [
      "id",
      "entryType",
      "category",
      "subtotalCents",
      "gstCents",
      "qstCents",
      "totalCents",
      "status",
      "entryDate",
      "reconciliationStatus",
    ].join(",");
    const lines = entries.map((e) =>
      [
        e.id,
        e.entryType,
        e.category,
        e.subtotalCents,
        e.gstCents,
        e.qstCents,
        e.totalCents,
        e.status,
        e.entryDate.toISOString(),
        e.reconciliation?.status ?? "",
      ].map(csvEscape).join(",")
    );
    const csv =
      `# Estimate / Internal summary only — not a government filing.\n` +
      `# Month summary: gross ${summary.grossRevenueCents}, net ${summary.netRevenueCents}\n` +
      `${header}\n` +
      lines.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="accounting-${summary.monthLabel}.csv"`,
      },
    });
  }

  if (type === "ledger" && format === "csv") {
    const rows = await prisma.accountingEntry.findMany({
      orderBy: { entryDate: "desc" },
      take: 5000,
      include: { reconciliation: true },
    });
    const header = [
      "id",
      "entryType",
      "category",
      "sourceType",
      "subtotalCents",
      "gstCents",
      "qstCents",
      "totalCents",
      "status",
      "entryDate",
      "reconciliationStatus",
      "notes",
    ].join(",");
    const lines = rows.map((e) =>
      [
        e.id,
        e.entryType,
        e.category,
        e.sourceType ?? "",
        e.subtotalCents,
        e.gstCents,
        e.qstCents,
        e.totalCents,
        e.status,
        e.entryDate.toISOString(),
        e.reconciliation?.status ?? "",
        (e.notes ?? "").replace(/\n/g, " "),
      ].map(csvEscape).join(",")
    );
    const csv =
      `# Estimate / Internal summary only\n` +
      `${header}\n` +
      lines.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="accounting-ledger.csv"`,
      },
    });
  }

  if (type === "month" && format === "pdf") {
    const entries = await prisma.accountingEntry.findMany({
      where: {
        entryDate: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0, 23, 59, 59, 999),
        },
      },
    });
    const summary = aggregateMonthEnd(entries, year, month);
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(10);
    doc.text("LECIPM — Monthly accounting summary (internal)", 40, 40);
    doc.setFontSize(8);
    doc.text("Estimate / Internal summary only — not legal, tax, or accounting advice.", 40, 56);
    doc.setFontSize(10);
    let y = 80;
    const rows = [
      ["Period", summary.monthLabel],
      ["Gross revenue (subtotal)", `$${(summary.grossRevenueCents / 100).toFixed(2)}`],
      ["GST collected (revenue)", `$${(summary.revenueGstCents / 100).toFixed(2)}`],
      ["QST collected (revenue)", `$${(summary.revenueQstCents / 100).toFixed(2)}`],
      ["Expenses (subtotal)", `$${(summary.totalExpenseCents / 100).toFixed(2)}`],
      ["GST on expenses", `$${(summary.expenseGstCents / 100).toFixed(2)}`],
      ["QST on expenses", `$${(summary.expenseQstCents / 100).toFixed(2)}`],
      ["Net revenue (illustrative)", `$${(summary.netRevenueCents / 100).toFixed(2)}`],
      ["Profit estimate (illustrative)", `$${(summary.profitEstimateCents / 100).toFixed(2)}`],
    ];
    for (const [a, b] of rows) {
      doc.text(`${a}: ${b}`, 40, y);
      y += 16;
    }
    const buf = Buffer.from(doc.output("arraybuffer"));
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="accounting-month-${summary.monthLabel}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "Unsupported export" }, { status: 400 });
}
