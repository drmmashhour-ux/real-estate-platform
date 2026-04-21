import { logInfo } from "@/lib/logger";
import type { LenderPackagePayload } from "@/modules/capital/capital.types";

const TAG = "[lender-package-pdf]";

const BLACK: [number, number, number] = [22, 22, 26];
const GOLD: [number, number, number] = [176, 141, 74];
const MUTED: [number, number, number] = [95, 95, 102];

function wrapLines(doc: import("jspdf").jsPDF, text: string, maxWidth: number): string[] {
  const lines = doc.splitTextToSize(text, maxWidth);
  return Array.isArray(lines) ? lines : [text];
}

function ensureSpace(
  doc: import("jspdf").jsPDF,
  y: number,
  needed: number,
  footerY: number
): { doc: import("jspdf").jsPDF; y: number } {
  if (y + needed > footerY - 10) {
    doc.addPage();
    return { doc, y: 48 };
  }
  return { doc, y };
}

export async function renderLenderPackagePdf(payload: LenderPackagePayload): Promise<Buffer> {
  logInfo(`${TAG} render start`, { dealTitle: payload.cover.dealTitle });
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 52;

  doc.setFillColor(...BLACK);
  doc.rect(0, 0, pageWidth, 72, "F");
  doc.setTextColor(...GOLD);
  doc.setFontSize(18);
  doc.text("LECIPM", 40, 42);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("Lender financing package", pageWidth - 40, 42, { align: "right" });

  let y = 96;
  doc.setTextColor(...BLACK);
  doc.setFontSize(14);
  doc.text(payload.cover.dealTitle.slice(0, 90), 40, y);
  y += 22;
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`${payload.cover.date} · ${payload.cover.requestedFinancingType}`, 40, y);
  y += 28;

  doc.setTextColor(...BLACK);
  doc.setFontSize(11);
  doc.text("Executive summary", 40, y);
  y += 14;
  doc.setFontSize(9);
  for (const line of wrapLines(doc, payload.executiveSummary.shortNarrative, pageWidth - 80)) {
    ({ doc, y } = ensureSpace(doc, y, 14, footerY));
    doc.text(line, 40, y);
    y += 12;
  }
  y += 8;

  ({ doc, y } = ensureSpace(doc, y, 60, footerY));
  doc.setFontSize(11);
  doc.text("Financing request", 40, y);
  y += 14;
  doc.setFontSize(9);
  doc.text(`Capital required (planning): ${payload.financingRequest.capitalRequired ?? "TBD"}`, 40, y);
  y += 12;
  for (const line of wrapLines(doc, payload.financingRequest.targetStructure, pageWidth - 80)) {
    ({ doc, y } = ensureSpace(doc, y, 14, footerY));
    doc.text(line, 40, y);
    y += 12;
  }
  y += 8;

  ({ doc, y } = ensureSpace(doc, y, 40, footerY));
  doc.setFontSize(11);
  doc.text("Investment case — strengths", 40, y);
  y += 14;
  doc.setFontSize(9);
  for (const s of payload.investmentCase.strengths.slice(0, 14)) {
    for (const line of wrapLines(doc, `• ${s}`, pageWidth - 80)) {
      ({ doc, y } = ensureSpace(doc, y, 14, footerY));
      doc.text(line, 40, y);
      y += 12;
    }
  }
  y += 6;

  ({ doc, y } = ensureSpace(doc, y, 40, footerY));
  doc.setFontSize(11);
  doc.text("Investment case — mitigants / risks", 40, y);
  y += 14;
  doc.setFontSize(9);
  for (const s of payload.investmentCase.mitigants.slice(0, 14)) {
    for (const line of wrapLines(doc, `• ${s}`, pageWidth - 80)) {
      ({ doc, y } = ensureSpace(doc, y, 14, footerY));
      doc.text(line, 40, y);
      y += 12;
    }
  }

  ({ doc, y } = ensureSpace(doc, y, 36, footerY));
  doc.setFontSize(11);
  doc.text("ESG / retrofit", 40, y);
  y += 14;
  doc.setFontSize(9);
  doc.text(`Score: ${payload.esgSection.score} · Confidence: ${payload.esgSection.confidence}`, 40, y);
  y += 12;
  for (const line of wrapLines(doc, payload.esgSection.financingRelevance, pageWidth - 80)) {
    ({ doc, y } = ensureSpace(doc, y, 14, footerY));
    doc.text(line, 40, y);
    y += 12;
  }

  ({ doc, y } = ensureSpace(doc, y, 36, footerY));
  doc.setFontSize(11);
  doc.text("Diligence — critical conditions", 40, y);
  y += 14;
  doc.setFontSize(9);
  for (const c of payload.diligenceStatus.criticalConditions.slice(0, 20)) {
    ({ doc, y } = ensureSpace(doc, y, 14, footerY));
    doc.text(`• ${c}`, 40, y);
    y += 12;
  }

  ({ doc, y } = ensureSpace(doc, y, 36, footerY));
  doc.setFontSize(11);
  doc.text("Appendices & references", 40, y);
  y += 14;
  doc.setFontSize(9);
  doc.text(`Memo ref: ${payload.appendices.memoReference ?? "n/a"}`, 40, y);
  y += 12;
  doc.text(`IC pack ref: ${payload.appendices.icPackReference ?? "n/a"}`, 40, y);
  y += 16;

  ({ doc, y } = ensureSpace(doc, y, 48, footerY));
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  for (const line of wrapLines(doc, payload.disclaimers.verifiedVsEstimated, pageWidth - 80)) {
    ({ doc, y } = ensureSpace(doc, y, 14, footerY));
    doc.text(line, 40, y);
    y += 12;
  }
  y += 8;
  for (const line of wrapLines(doc, payload.disclaimers.lenderSafe, pageWidth - 80)) {
    ({ doc, y } = ensureSpace(doc, y, 14, footerY));
    doc.text(line, 40, y);
    y += 12;
  }

  doc.setFontSize(7);
  doc.text(
    `LECIPM · Confidential · ${payload.schemaVersion} · ${payload.generatedAt.slice(0, 10)}`,
    40,
    pageHeight - 28
  );

  return Buffer.from(doc.output("arraybuffer"));
}
