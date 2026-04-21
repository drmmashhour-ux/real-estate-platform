import type { InvestorIcPackPayload } from "@/modules/investor/investor.types";
import type { InvestorMemoPayload } from "@/modules/investor/investor.types";
import { logInfo } from "@/lib/logger";

const TAG = "[investor-pdf]";

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

function footer(doc: import("jspdf").jsPDF, version: string, pageWidth: number, pageHeight: number) {
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(
    `LECIPM · Confidential · Generated ${new Date().toISOString().slice(0, 10)} · ${version}`,
    40,
    pageHeight - 28
  );
  doc.text("Estimates are labeled in-body where applicable — not verified unless stated.", 40, pageHeight - 18, {
    maxWidth: pageWidth - 80,
  });
}

export async function renderInvestorMemoPdf(payload: InvestorMemoPayload): Promise<Buffer> {
  logInfo(`${TAG} memo render start`, { listingId: payload.listing.id });
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
  doc.text("Investor Memo", pageWidth - 40, 42, { align: "right" });

  let y = 96;
  doc.setTextColor(...BLACK);
  doc.setFontSize(14);
  doc.text(payload.listing.title.slice(0, 90), 40, y);
  y += 22;
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`${payload.memoType} · ${payload.schemaVersion}`, 40, y);
  y += 28;

  doc.setTextColor(...BLACK);
  doc.setFontSize(11);
  doc.text("Executive summary", 40, y);
  y += 14;
  doc.setFontSize(9);
  for (const line of wrapLines(doc, payload.executiveSummary, pageWidth - 80)) {
    ({ doc, y } = ensureSpace(doc, y, 14, footerY));
    doc.text(line, 40, y);
    y += 12;
  }
  y += 10;

  ({ doc, y } = ensureSpace(doc, y, 40, footerY));
  doc.setFontSize(11);
  doc.text(`Recommendation: ${payload.headline.recommendation}`, 40, y);
  y += 14;
  doc.setFontSize(9);
  doc.text(`Confidence: ${payload.headline.confidenceLevel}`, 40, y);
  y += 18;

  ({ doc, y } = ensureSpace(doc, y, 24, footerY));
  doc.setFontSize(11);
  doc.text("Strengths", 40, y);
  y += 14;
  doc.setFontSize(9);
  for (const s of payload.strengths.slice(0, 10)) {
    for (const line of wrapLines(doc, `• ${s}`, pageWidth - 80)) {
      ({ doc, y } = ensureSpace(doc, y, 14, footerY));
      doc.text(line, 40, y);
      y += 12;
    }
  }
  y += 8;

  ({ doc, y } = ensureSpace(doc, y, 24, footerY));
  doc.setFontSize(11);
  doc.text("Risks", 40, y);
  y += 14;
  doc.setFontSize(9);
  for (const s of payload.risks.slice(0, 14)) {
    for (const line of wrapLines(doc, `• ${s}`, pageWidth - 80)) {
      ({ doc, y } = ensureSpace(doc, y, 14, footerY));
      doc.text(line, 40, y);
      y += 12;
    }
  }
  y += 8;

  ({ doc, y } = ensureSpace(doc, y, 80, footerY));
  doc.setFontSize(11);
  doc.text("ESG summary", 40, y);
  y += 14;
  doc.setFontSize(9);
  const esgBlock = [
    `Score: ${payload.esgSummary.esgScore ?? "—"} · Grade: ${payload.esgSummary.esgGrade ?? "—"}`,
    payload.esgSummary.carbonSummary,
    payload.esgSummary.verifiedVsEstimatedNote,
  ].join(" ");
  for (const line of wrapLines(doc, esgBlock, pageWidth - 80)) {
    ({ doc, y } = ensureSpace(doc, y, 14, footerY));
    doc.text(line, 40, y);
    y += 12;
  }
  y += 12;

  ({ doc, y } = ensureSpace(doc, y, 60, footerY));
  doc.setFontSize(11);
  doc.text("Acquisition screening", 40, y);
  y += 14;
  doc.setFontSize(9);
  const acq = payload.acquisitionSummary;
  for (const line of wrapLines(doc, `${acq.screenStatus} · ${acq.whyItPassesOrFails}`, pageWidth - 80)) {
    ({ doc, y } = ensureSpace(doc, y, 14, footerY));
    doc.text(line, 40, y);
    y += 12;
  }
  y += 12;

  ({ doc, y } = ensureSpace(doc, y, 60, footerY));
  doc.setFontSize(11);
  doc.text("Recommended next steps", 40, y);
  y += 14;
  doc.setFontSize(9);
  for (const s of payload.nextSteps.slice(0, 10)) {
    for (const line of wrapLines(doc, `• ${s}`, pageWidth - 80)) {
      ({ doc, y } = ensureSpace(doc, y, 14, footerY));
      doc.text(line, 40, y);
      y += 12;
    }
  }
  y += 12;

  ({ doc, y } = ensureSpace(doc, y, 80, footerY));
  doc.setFontSize(11);
  doc.text("Disclaimer", 40, y);
  y += 14;
  doc.setFontSize(8);
  for (const line of wrapLines(doc, payload.disclaimers.adviceDisclaimer, pageWidth - 80)) {
    ({ doc, y } = ensureSpace(doc, y, 12, footerY));
    doc.text(line, 40, y);
    y += 11;
  }
  for (const line of wrapLines(doc, payload.disclaimers.internalToolDisclaimer, pageWidth - 80)) {
    ({ doc, y } = ensureSpace(doc, y, 12, footerY));
    doc.text(line, 40, y);
    y += 11;
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    footer(doc, payload.schemaVersion, pageWidth, pageHeight);
  }

  logInfo(`${TAG} memo render end`, { listingId: payload.listing.id });
  return Buffer.from(doc.output("arraybuffer"));
}

export async function renderInvestorIcPackPdf(payload: InvestorIcPackPayload): Promise<Buffer> {
  logInfo(`${TAG} ic-pack render start`, {});
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
  doc.text("Investment Committee Pack", pageWidth - 40, 42, { align: "right" });

  let y = 96;
  doc.setTextColor(...BLACK);
  doc.setFontSize(14);
  doc.text(payload.cover.listingTitle.slice(0, 90), 40, y);
  y += 22;
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`${payload.cover.reportType} · ${payload.schemaVersion}`, 40, y);
  y += 28;

  const sections: Array<{ title: string; body: string }> = [
    {
      title: "Committee recommendation",
      body: `${payload.cover.recommendation} (${payload.cover.confidenceLevel})\n${payload.finalRecommendation.rationale}`,
    },
    {
      title: "Investment thesis",
      body: `${payload.investmentThesis.summary}\n${payload.investmentThesis.whyNow}`,
    },
    {
      title: "Asset snapshot",
      body: `${payload.assetSnapshot.location} · ${payload.assetSnapshot.type}`,
    },
    {
      title: "Risk assessment",
      body: [
        ...payload.riskAssessment.criticalRisks.map((r) => `Critical: ${r}`),
        ...payload.riskAssessment.highRisks.map((r) => `High: ${r}`),
      ].join("\n"),
    },
    {
      title: "ESG & evidence",
      body: `${payload.esgSection.evidenceStrength}\n${payload.esgSection.carbonSummary}`,
    },
    {
      title: "Acquisition",
      body: `${payload.acquisitionSection.screenStatus}\nBlockers:\n${payload.acquisitionSection.blockers.join("\n")}`,
    },
    {
      title: "Actions / retrofit / financing",
      body: payload.retrofitPlan.phaseRoadmap.join("\n"),
    },
    {
      title: "Optimizer",
      body: `${payload.optimizerSection.selectedStrategy ?? "—"} · ${payload.optimizerSection.expectedDirectionalImprovement ?? ""}`,
    },
    {
      title: "Appendix — methodology",
      body: payload.appendices.methodologyNotes.join("\n"),
    },
  ];

  doc.setFontSize(10);
  for (const sec of sections) {
    ({ doc, y } = ensureSpace(doc, y, 36, footerY));
    doc.setFontSize(11);
    doc.setTextColor(...BLACK);
    doc.text(sec.title, 40, y);
    y += 14;
    doc.setFontSize(9);
    doc.setTextColor(...BLACK);
    for (const line of wrapLines(doc, sec.body, pageWidth - 80)) {
      ({ doc, y } = ensureSpace(doc, y, 14, footerY));
      doc.text(line, 40, y);
      y += 12;
    }
    y += 10;
  }

  ({ doc, y } = ensureSpace(doc, y, 60, footerY));
  doc.setFontSize(11);
  doc.text("Disclaimer", 40, y);
  y += 14;
  doc.setFontSize(8);
  for (const line of wrapLines(doc, payload.disclaimers.adviceDisclaimer + "\n" + payload.disclaimers.internalToolDisclaimer, pageWidth - 80)) {
    ({ doc, y } = ensureSpace(doc, y, 11, footerY));
    doc.text(line, 40, y);
    y += 11;
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    footer(doc, payload.schemaVersion, pageWidth, pageHeight);
  }

  logInfo(`${TAG} ic-pack render end`, {});
  return Buffer.from(doc.output("arraybuffer"));
}
