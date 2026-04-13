import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { loadMonthlyInvestorRollup, formatMonthlyInvestorSummaryText } from "@/src/modules/investor-metrics/investorMonthlySummary";
import { buildMonthlySummaryPdfBuffer, buildInvestorReportPdfBuffer } from "@/src/modules/investor-metrics/investorPdfReport";
import { loadInvestorReportBundle } from "@/src/modules/investor-metrics/investorReportBundle";
import { loadInvestorPlatformFunnel } from "@/src/modules/investor-metrics/investorFunnel";
import { loadFinancialProjections } from "@/src/modules/investor-metrics/investorProjections";
import { utcDayStart } from "@/src/modules/investor-metrics/metricsEngine";
import {
  buildChartSeriesExport,
  buildFunnelSnapshotCsv,
  buildMetricSnapshotsCsv,
  buildProjectionsCsv,
} from "@/src/modules/investor-metrics/investorExport";
import { getRecentMetricSnapshots } from "@/src/modules/investor-metrics/metricsSnapshot";

export const dynamic = "force-dynamic";

function parseYearMonth(searchParams: URLSearchParams, now: Date): { year: number; month: number } {
  const yRaw = searchParams.get("year");
  const mRaw = searchParams.get("month");
  if (yRaw && mRaw) {
    const year = Number.parseInt(yRaw, 10);
    const month = Number.parseInt(mRaw, 10);
    if (Number.isFinite(year) && month >= 1 && month <= 12) return { year, month };
  }
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  d.setUTCMonth(d.getUTCMonth() - 1);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

export async function GET(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return Response.json({ error: "Forbidden" }, { status: 403 });

  const format = req.nextUrl.searchParams.get("format") ?? "csv";
  const now = new Date();
  const dayStamp = utcDayStart(now).toISOString().slice(0, 10);

  if (format === "report" || format === "text") {
    const bundle = await loadInvestorReportBundle(now);
    return new Response(bundle.fullText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="lecipm-investor-report-${dayStamp}.txt"`,
      },
    });
  }

  if (format === "pdf") {
    const bundle = await loadInvestorReportBundle(now);
    const buf = await buildInvestorReportPdfBuffer(bundle);
    return new Response(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lecipm-investor-report-${dayStamp}.pdf"`,
      },
    });
  }

  if (format === "monthly") {
    const { year, month } = parseYearMonth(req.nextUrl.searchParams, now);
    const rollup = await loadMonthlyInvestorRollup(year, month);
    const body = formatMonthlyInvestorSummaryText(rollup);
    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="lecipm-investor-monthly-${rollup.monthLabel}.txt"`,
      },
    });
  }

  if (format === "monthly-pdf") {
    const { year, month } = parseYearMonth(req.nextUrl.searchParams, now);
    const rollup = await loadMonthlyInvestorRollup(year, month);
    const buf = await buildMonthlySummaryPdfBuffer(rollup);
    return new Response(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="lecipm-investor-monthly-${rollup.monthLabel}.pdf"`,
      },
    });
  }

  if (format === "chart-json" || format === "charts") {
    const limitRaw = req.nextUrl.searchParams.get("limit");
    const limit = Math.min(730, Math.max(30, Number.parseInt(limitRaw ?? "365", 10) || 365));
    const rows = await getRecentMetricSnapshots(limit);
    const json = buildChartSeriesExport(rows);
    return new Response(json, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="lecipm-investor-chart-series.json"`,
      },
    });
  }

  if (format === "funnel") {
    const funnel = await loadInvestorPlatformFunnel(now, 30);
    const csv = buildFunnelSnapshotCsv(funnel);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="lecipm-investor-funnel.csv"`,
      },
    });
  }

  if (format === "projections") {
    const projections = await loadFinancialProjections(now);
    const csv = buildProjectionsCsv(projections);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="lecipm-investor-projections.csv"`,
      },
    });
  }

  const rows = await getRecentMetricSnapshots(365);
  const csv = buildMetricSnapshotsCsv(rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lecipm-investor-snapshots.csv"`,
    },
  });
}
