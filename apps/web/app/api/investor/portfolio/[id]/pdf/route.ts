import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { PORTFOLIO_DISCLAIMER_TEXT } from "@/lib/invest/portfolio-disclaimer";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  const s = await prisma.portfolioScenario.findFirst({
    where: { id, userId },
    include: { items: true, investorProfile: true },
  });
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  let y = 40;
  doc.setFontSize(10);
  doc.text("LECIPM — Portfolio scenario (estimate / planning tool)", 40, y);
  y += 14;
  doc.setFontSize(8);
  doc.text("Not financial, legal, tax, or investment advice.", 40, y);
  y += 20;
  doc.setFontSize(10);
  doc.text(`Title: ${s.title}`, 40, y);
  y += 14;
  doc.text(`Kind: ${s.scenarioKind ?? "custom"}`, 40, y);
  y += 14;
  doc.text(
    `Totals — est. monthly CF: $${(s.projectedMonthlyCashFlowCents / 100).toFixed(0)} | avg ROI: ${s.projectedAverageRoiPercent.toFixed(2)}% | diversification: ${s.projectedDiversificationScore?.toFixed(0) ?? "—"}`,
    40,
    y,
    { maxWidth: 520 }
  );
  y += 28;

  doc.setFontSize(9);
  doc.text("Line items:", 40, y);
  y += 12;
  for (const it of s.items) {
    if (y > 720) {
      doc.addPage();
      y = 40;
    }
    const line = `${it.city ?? "?"} | $${(it.purchasePriceCents / 100).toLocaleString()} | ROI ${it.projectedRoiPercent?.toFixed(2) ?? "—"}% | fit ${it.fitScore?.toFixed(0) ?? "—"}`;
    doc.text(line.slice(0, 120), 40, y);
    y += 11;
  }

  y += 18;
  doc.setFontSize(8);
  doc.text("Disclaimer:", 40, y);
  y += 10;
  doc.text(PORTFOLIO_DISCLAIMER_TEXT, 40, y, { maxWidth: 520 });

  const buf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="lecipm-portfolio-${s.id.slice(0, 8)}.pdf"`,
    },
  });
}
