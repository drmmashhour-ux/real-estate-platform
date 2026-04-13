import { formatFunnelForReport, loadInvestorPlatformFunnel } from "./investorFunnel";
import { formatProjectionsForReport, loadFinancialProjections } from "./investorProjections";
import {
  aggregateSnapshotInputs,
  computeLiveKpis,
  formatInvestorReportText,
  getMarketplaceMetrics,
  utcDayStart,
} from "./metricsEngine";

export type InvestorReportSections = {
  title: string;
  generatedAtLabel: string;
  sections: { heading: string; lines: string[] }[];
  fullText: string;
};

function linesFromBlock(text: string): string[] {
  return text.split("\n").filter((l) => l.length > 0);
}

/**
 * Single load path for TXT / PDF / bundles — keeps metrics aggregation aligned.
 */
export async function loadInvestorReportBundle(now: Date = new Date()): Promise<InvestorReportSections> {
  const [snap, kpis, marketplace, funnel, projections] = await Promise.all([
    aggregateSnapshotInputs(now),
    computeLiveKpis(now),
    getMarketplaceMetrics(now),
    loadInvestorPlatformFunnel(now, 30),
    loadFinancialProjections(now),
  ]);

  const snapshotDate = utcDayStart(now).toISOString().slice(0, 10);
  const core = formatInvestorReportText({
    snapshotDate,
    snapshot: snap,
    kpis,
    marketplace,
  });
  const funnelBlock = formatFunnelForReport(funnel);
  const projBlock = formatProjectionsForReport(projections);

  const fullText = [core, "", funnelBlock, "", projBlock].join("\n");

  const sections: InvestorReportSections["sections"] = [
    { heading: "Platform snapshot & KPIs", lines: linesFromBlock(core) },
    { heading: "Acquisition funnel (30d)", lines: linesFromBlock(funnelBlock) },
    { heading: "Financial projections (illustrative)", lines: linesFromBlock(projBlock) },
  ];

  return {
    title: `LECIPM investor report — ${snapshotDate}`,
    generatedAtLabel: now.toISOString(),
    sections,
    fullText,
  };
}
