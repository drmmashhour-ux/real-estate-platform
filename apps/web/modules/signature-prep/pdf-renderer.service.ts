import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * Builds a minimal signable PDF from key/value lines + anchor markers for e-sign tabs.
 * Production: replace with template merge from official broker-authorized outputs.
 */
export async function renderDraftSignablePdf(input: {
  title: string;
  lines: { label: string; value: string }[];
  anchors: { role: string; anchor: string }[];
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  page.drawText(input.title, { x: 50, y: 760, size: 14, font, color: rgb(0, 0, 0) });

  let y = 730;
  for (const row of input.lines) {
    const line = `${row.label}: ${row.value}`.slice(0, 100);
    page.drawText(line, { x: 50, y, size: 10, font });
    y -= 14;
    if (y < 200) break;
  }

  let ay = 160;
  for (const a of input.anchors) {
    page.drawText(`${a.anchor} (${a.role})`, { x: 72, y: ay, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
    ay -= 12;
  }

  return pdf.save();
}

export function bufferToBase64(buf: Uint8Array): string {
  return Buffer.from(buf).toString("base64");
}
