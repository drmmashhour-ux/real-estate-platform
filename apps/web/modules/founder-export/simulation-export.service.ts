import type { ThreeMonthProjection } from "@/modules/launch-simulation/launch-simulation.types";
import type { SimulationExportFormat } from "./founder-export.types";

function monthRows(p: ThreeMonthProjection): string[][] {
  const header = [
    "month",
    "bnhubBookingFees",
    "bnhubSubscriptions",
    "bnhubBoosts",
    "brokerSubscriptions",
    "brokerLeadFees",
    "brokerSuccessFees",
    "otherDocAi",
    "totalRevenue",
  ];
  const rows = p.months.map((m) => [
    String(m.month),
    String(m.revenueBreakdown.bnhubBookingFees),
    String(m.revenueBreakdown.bnhubSubscriptions),
    String(m.revenueBreakdown.bnhubBoosts),
    String(m.revenueBreakdown.brokerSubscriptions),
    String(m.revenueBreakdown.brokerLeadFees),
    String(m.revenueBreakdown.brokerSuccessFees),
    String(m.revenueBreakdown.otherDocAi),
    String(m.totalRevenue),
  ]);
  return [header, ...rows];
}

function escapeCsvCell(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportSimulationTableCsv(projections: {
  conservative: ThreeMonthProjection;
  baseline: ThreeMonthProjection;
  optimistic: ThreeMonthProjection;
}): { contentType: string; filename: string; body: string } {
  const parts: string[] = [];
  for (const scenario of ["conservative", "baseline", "optimistic"] as const) {
    parts.push(`# ${scenario} (projected / estimate)`);
    const rows = monthRows(projections[scenario]);
    parts.push(rows.map((r) => r.map(escapeCsvCell).join(",")).join("\n"));
    parts.push("");
  }
  return {
    contentType: "text/csv; charset=utf-8",
    filename: `lecipm-simulation-${new Date().toISOString().slice(0, 10)}.csv`,
    body: parts.join("\n"),
  };
}

export function exportSimulationJson(projections: {
  conservative: ThreeMonthProjection;
  baseline: ThreeMonthProjection;
  optimistic: ThreeMonthProjection;
}): { contentType: string; filename: string; body: string } {
  return {
    contentType: "application/json; charset=utf-8",
    filename: `lecipm-simulation-${new Date().toISOString().slice(0, 10)}.json`,
    body: JSON.stringify(
      {
        kind: "launch_simulation_export_v1",
        label: "projected_estimates_not_actuals",
        generatedAt: new Date().toISOString(),
        scenarios: projections,
      },
      null,
      2
    ),
  };
}

export function exportSimulationMarkdown(projections: {
  conservative: ThreeMonthProjection;
  baseline: ThreeMonthProjection;
  optimistic: ThreeMonthProjection;
}): { contentType: string; filename: string; body: string } {
  const lines: string[] = [
    "# LECIPM — 3-month revenue simulation (projected / estimate)",
    "",
    "_Not audited financials. Scenarios are illustrative._",
    "",
  ];
  for (const scenario of ["conservative", "baseline", "optimistic"] as const) {
    const p = projections[scenario];
    lines.push(`## ${scenario}`, "", `Cumulative (3 mo): **${p.cumulativeRevenueCad.toFixed(2)}** (projected)`, "");
    for (const m of p.months) {
      lines.push(`### Month ${m.month}`);
      lines.push(`- Total: ${m.totalRevenue.toFixed(2)}`);
      lines.push(`- BNHub booking fees: ${m.revenueBreakdown.bnhubBookingFees.toFixed(2)}`);
      lines.push(`- BNHub subscriptions: ${m.revenueBreakdown.bnhubSubscriptions.toFixed(2)}`);
      lines.push(`- BNHub boosts: ${m.revenueBreakdown.bnhubBoosts.toFixed(2)}`);
      lines.push(`- Broker subscriptions: ${m.revenueBreakdown.brokerSubscriptions.toFixed(2)}`);
      lines.push(`- Broker lead fees: ${m.revenueBreakdown.brokerLeadFees.toFixed(2)}`);
      lines.push(`- Broker success fees: ${m.revenueBreakdown.brokerSuccessFees.toFixed(2)}`);
      lines.push(`- Other (doc/AI): ${m.revenueBreakdown.otherDocAi.toFixed(2)}`);
      lines.push("");
    }
  }
  return {
    contentType: "text/markdown; charset=utf-8",
    filename: `lecipm-simulation-${new Date().toISOString().slice(0, 10)}.md`,
    body: lines.join("\n"),
  };
}

export function buildSimulationExport(
  format: SimulationExportFormat,
  projections: {
    conservative: ThreeMonthProjection;
    baseline: ThreeMonthProjection;
    optimistic: ThreeMonthProjection;
  }
): { contentType: string; filename: string; body: string } {
  switch (format) {
    case "csv":
      return exportSimulationTableCsv(projections);
    case "markdown":
      return exportSimulationMarkdown(projections);
    case "json":
    default:
      return exportSimulationJson(projections);
  }
}
