import { buildInvestorMetricTable } from "@/modules/investor-metrics/investor-metrics.service";
import { getRecentMetricSnapshots } from "@/src/modules/investor-metrics/metricsSnapshot";
import {
  buildChartSeriesExport,
  buildMetricSnapshotsCsv,
} from "@/src/modules/investor-metrics/investorExport";
import { loadInvestorReportBundle } from "@/src/modules/investor-metrics/investorReportBundle";

export type ExportKind = "metrics_json" | "snapshots_csv" | "snapshots_json" | "investor_txt";

export async function buildLaunchInvestorExport(kind: ExportKind, now = new Date()): Promise<{
  contentType: string;
  filename: string;
  body: string | Uint8Array;
}> {
  const day = now.toISOString().slice(0, 10);

  if (kind === "metrics_json") {
    const table = await buildInvestorMetricTable(now);
    return {
      contentType: "application/json; charset=utf-8",
      filename: `lecipm-investor-metrics-${day}.json`,
      body: JSON.stringify(table, null, 2),
    };
  }

  if (kind === "snapshots_csv") {
    const rows = await getRecentMetricSnapshots(365);
    return {
      contentType: "text/csv; charset=utf-8",
      filename: `lecipm-metric-snapshots-${day}.csv`,
      body: buildMetricSnapshotsCsv(rows),
    };
  }

  if (kind === "snapshots_json") {
    const rows = await getRecentMetricSnapshots(365);
    return {
      contentType: "application/json; charset=utf-8",
      filename: `lecipm-metric-snapshots-${day}.json`,
      body: buildChartSeriesExport(rows),
    };
  }

  const bundle = await loadInvestorReportBundle(now);
  return {
    contentType: "text/plain; charset=utf-8",
    filename: `lecipm-investor-report-${day}.txt`,
    body: bundle.fullText,
  };
}
