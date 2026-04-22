import { jsPDF } from "jspdf";

import type { InvestorPitchDashboardVm } from "./investor-pitch.types";

export type InvestorExportKind = "pitch_pdf" | "summary_report" | "financial_snapshot";

function hubEntries(vm: InvestorPitchDashboardVm): [string, number][] {
  return Object.entries(vm.revenueByHub).map(([k, v]) => [k, typeof v === "number" ? v : 0]);
}

/**
 * Investor-ready pitch deck PDF (10 slides mirror `vm.slides` + appendix metrics).
 */
export function buildPitchDeckPdf(vm: InvestorPitchDashboardVm): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const gold: [number, number, number] = [212, 175, 55];
  const margin = 18;
  let y = margin;

  const header = (title: string) => {
    doc.setFillColor(8, 8, 8);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFontSize(18);
    doc.text(title, margin, 18);
    doc.setTextColor(230, 230, 230);
    y = 38;
  };

  header("LECIPM — Investor pitch");
  doc.setFontSize(9);
  doc.text(`Generated ${vm.generatedAt}${vm.sampleMode ? " · SAMPLE DATA" : ""}`, margin, y);
  y += 10;

  for (const slide of vm.slides) {
    doc.addPage();
    header(`${slide.index}. ${slide.title}`);
    doc.setFontSize(11);
    for (const line of slide.bullets) {
      const wrapped = doc.splitTextToSize(`• ${line}`, pageW - margin * 2);
      doc.text(wrapped, margin, y);
      y += 6 + (wrapped.length - 1) * 5;
      if (y > 270) {
        doc.addPage();
        header(`${slide.index}. ${slide.title} (cont.)`);
      }
    }
  }

  doc.addPage();
  header("Appendix — KPIs");
  doc.setFontSize(10);
  const m = vm.liveMetrics;
  const lines = [
    `Users: ${m.totalUsers}`,
    `Listings: ${m.totalListings}`,
    `Bookings (30d window): ${m.bookings30d}`,
    `Leads (30d approx): ${m.leads30dApprox}`,
    `Revenue (30d approx): ${m.revenue30dApprox}`,
    "",
    vm.revenueByHubDisclaimer,
  ];
  for (const line of lines) {
    doc.text(line, margin, y);
    y += 7;
  }
  y += 4;
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text("Revenue by hub (period per dashboard configuration)", margin, y);
  y += 8;
  doc.setTextColor(230, 230, 230);
  for (const [hub, amt] of hubEntries(vm)) {
    doc.text(`${hub}: ${amt.toFixed(2)}`, margin, y);
    y += 6;
  }

  const out = doc.output("arraybuffer");
  return Buffer.from(out);
}

export function buildSummaryReport(vm: InvestorPitchDashboardVm): string {
  const lines: string[] = [
    "# LECIPM — Executive summary",
    "",
    `Generated: ${vm.generatedAt}`,
    vm.sampleMode ? "**Mode:** illustrative sample data" : "**Mode:** database-backed aggregates",
    "",
    "## Narrative",
    "",
  ];
  for (const b of vm.narrativeBlocks) {
    lines.push(`### ${b.title}`, "", ...b.paragraphs.map((p) => `- ${p}`), "");
  }
  lines.push(
    "## Live metrics snapshot",
    "",
    `- Users: ${vm.liveMetrics.totalUsers}`,
    `- Listings: ${vm.liveMetrics.totalListings}`,
    `- Bookings (30d): ${vm.liveMetrics.bookings30d}`,
    `- Leads (30d approx): ${vm.liveMetrics.leads30dApprox}`,
    `- Revenue (30d approx): ${vm.liveMetrics.revenue30dApprox}`,
    "",
    "## Revenue by hub",
    "",
    ...hubEntries(vm).map(([k, v]) => `- ${k}: ${v.toFixed(2)}`),
    "",
    vm.revenueByHubDisclaimer,
  );
  return lines.join("\n");
}

export function buildFinancialSnapshot(vm: InvestorPitchDashboardVm): Record<string, unknown> {
  return {
    generatedAt: vm.generatedAt,
    sampleMode: vm.sampleMode,
    liveMetrics: vm.liveMetrics,
    revenueByHub: vm.revenueByHub,
    disclaimer: vm.revenueByHubDisclaimer,
    acquisition: vm.acquisitionSnapshot ?? null,
    growthDailyPoints: vm.growthDaily.length,
    growthWeeklyPoints: vm.growthWeekly.length,
  };
}

export function financialSnapshotJson(vm: InvestorPitchDashboardVm): string {
  return JSON.stringify(buildFinancialSnapshot(vm), null, 2);
}
