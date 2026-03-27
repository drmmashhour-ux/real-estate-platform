import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Row = { label: string; values: string[] };

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    title?: string;
    columns?: string[];
    rows?: Row[];
    recommendation?: string;
  } | null;

  if (!body?.rows?.length) {
    return NextResponse.json({ error: "rows required" }, { status: 400 });
  }

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  doc.setFontSize(10);
  doc.text("LECIPM — Property comparison", 40, 36);
  doc.setFontSize(8);
  doc.text("Estimate / Internal summary only. Not legal, tax, mortgage, or investment advice.", 40, 50);

  const title = body.title ?? "Comparison";
  doc.setFontSize(11);
  doc.text(title, 40, 68);

  let y = 88;
  const colW = 120;
  const labelW = 140;
  const cols = body.columns ?? [];

  doc.setFontSize(8);
  doc.text("Metric", 40, y);
  cols.forEach((c, i) => {
    doc.text(c.slice(0, 22), 40 + labelW + i * colW, y);
  });
  y += 14;

  for (const row of body.rows) {
    if (y > 520) {
      doc.addPage();
      y = 40;
    }
    doc.text(row.label.slice(0, 28), 40, y);
    row.values.forEach((v, i) => {
      doc.text(String(v).slice(0, 24), 40 + labelW + i * colW, y);
    });
    y += 12;
  }

  if (body.recommendation) {
    y += 10;
    doc.setFontSize(9);
    doc.text("Suggestion (illustrative):", 40, y);
    y += 12;
    doc.setFontSize(8);
    doc.text(body.recommendation.slice(0, 400), 40, y, { maxWidth: 700 });
  }

  const buf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="lecipm-property-comparison.pdf"',
    },
  });
}
