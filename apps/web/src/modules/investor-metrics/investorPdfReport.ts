import type { InvestorReportSections } from "./investorReportBundle";
import type { MonthlyInvestorRollup } from "./investorMonthlySummary";
import { formatMonthlyInvestorSummaryText } from "./investorMonthlySummary";

/**
 * Multi-page investor PDF (jsPDF). Keeps copy readable for diligence / print.
 */
export async function buildInvestorReportPdfBuffer(bundle: InvestorReportSections): Promise<Buffer> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const maxW = 515;
  const pageH = 842;
  let y = 48;

  const newPage = () => {
    doc.addPage();
    y = 48;
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) newPage();
  };

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("LECIPM — Investor metrics", margin, y);
  y += 22;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(bundle.title, margin, y);
  y += 14;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${bundle.generatedAtLabel}`, margin, y);
  doc.setTextColor(0, 0, 0);
  y += 20;

  doc.setFontSize(9);
  const disclaimer =
    "Internal metrics summary for investor relations. Funnel and projections use platform definitions documented in the admin investor hub; projections are illustrative, not GAAP or audited forecasts.";
  doc.splitTextToSize(disclaimer, maxW).forEach((line) => {
    ensureSpace(12);
    doc.text(line, margin, y);
    y += 11;
  });
  y += 10;

  for (const sec of bundle.sections) {
    ensureSpace(28);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(sec.heading, margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const raw of sec.lines) {
      const wrapped = doc.splitTextToSize(raw, maxW);
      for (const line of wrapped) {
        ensureSpace(12);
        doc.text(line, margin, y);
        y += 11;
      }
    }
    y += 8;
  }

  return Buffer.from(doc.output("arraybuffer"));
}

/** Single-section PDF for monthly rollup text. */
export async function buildMonthlySummaryPdfBuffer(rollup: MonthlyInvestorRollup): Promise<Buffer> {
  const body = formatMonthlyInvestorSummaryText(rollup);
  const bundle: InvestorReportSections = {
    title: `Monthly summary — ${rollup.monthLabel}`,
    generatedAtLabel: new Date().toISOString(),
    fullText: body,
    sections: [{ heading: `Month ${rollup.monthLabel}`, lines: body.split("\n") }],
  };
  return buildInvestorReportPdfBuffer(bundle);
}
