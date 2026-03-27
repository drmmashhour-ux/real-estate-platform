import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** POST JSON: { title, rows: { label: string; value: string }[], disclaimer?: string } */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const title = String(body.title ?? "Estimate");
  const rows = Array.isArray(body.rows) ? body.rows : [];
  const disclaimer =
    String(
      body.disclaimer ??
        "Estimate / Internal summary only. Not legal, tax, mortgage, or accounting advice."
    );

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(12);
  doc.text("LECIPM", 40, 36);
  doc.setFontSize(10);
  doc.text(title, 40, 54);
  doc.setFontSize(8);
  doc.text(disclaimer, 40, 72, { maxWidth: 520 });

  let y = 96;
  doc.setFontSize(10);
  for (const row of rows) {
    if (typeof row !== "object" || row === null) continue;
    const r = row as Record<string, unknown>;
    const label = String(r.label ?? "");
    const value = String(r.value ?? "");
    doc.text(`${label}: ${value}`, 40, y);
    y += 14;
    if (y > 760) {
      doc.addPage();
      y = 40;
    }
  }

  const buf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="lecipm-estimate.pdf"`,
    },
  });
}
