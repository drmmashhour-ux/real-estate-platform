import type { MetricSnapshot } from "@prisma/client";
import { getRecentMetricSnapshots } from "@/src/modules/investor-metrics/metricsSnapshot";
import {
  getRevenueEngineDashboardStats,
  type RevenueEngineDashboardStats,
} from "@/src/modules/revenue/revenueEngine";
import { getPipelineSummary, type PipelineSummary } from "./pipeline";

export type FundraisingExportPayload = {
  generatedAt: string;
  traction: {
    totalUsers: number | null;
    revenue30d: number | null;
    bookings30d: number | null;
    growthTotalUsers: number | null;
    snapshotDate: string | null;
  };
  revenueEngine: RevenueEngineDashboardStats;
  fundraising: PipelineSummary;
};

export async function buildFundraisingExportPayload(): Promise<FundraisingExportPayload> {
  const [latest, engineStats, fundraising] = await Promise.all([
    getRecentMetricSnapshots(1),
    getRevenueEngineDashboardStats(),
    getPipelineSummary(50),
  ]);

  const snap: MetricSnapshot | undefined = latest[0];
  return {
    generatedAt: new Date().toISOString(),
    traction: {
      totalUsers: snap?.totalUsers ?? null,
      revenue30d: snap?.revenue ?? null,
      bookings30d: snap?.bookings ?? null,
      growthTotalUsers: snap?.totalUsers ?? null,
      snapshotDate: snap ? snap.date.toISOString().slice(0, 10) : null,
    },
    revenueEngine: engineStats,
    fundraising,
  };
}

export function fundraisingPayloadToJson(payload: FundraisingExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function fundraisingPayloadToCsv(payload: FundraisingExportPayload): string {
  const t = payload.traction;
  const lines = [
    "section,key,value",
    `traction,total_users,${t.totalUsers ?? ""}`,
    `traction,revenue_30d,${t.revenue30d ?? ""}`,
    `traction,bookings_30d,${t.bookings30d ?? ""}`,
    `traction,growth_total_users,${t.growthTotalUsers ?? ""}`,
    `traction,snapshot_date,${t.snapshotDate ?? ""}`,
    `revenue_engine,revenue_today,${payload.revenueEngine.revenueToday}`,
    `revenue_engine,open_opportunities,${payload.revenueEngine.openOpportunities}`,
    `fundraising,total_investors,${payload.fundraising.totalInvestors}`,
    `fundraising,pipeline_value_open_committed,${payload.fundraising.pipelineValueOpenCommitted}`,
    `fundraising,committed_value,${payload.fundraising.committedValue}`,
    `fundraising,closed_value,${payload.fundraising.closedValue}`,
  ];
  for (const [stage, n] of Object.entries(payload.fundraising.byStage)) {
    lines.push(`fundraising_stage,${escapeCsv(stage)},${n}`);
  }
  return lines.join("\n");
}

function escapeCsv(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
