import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import {
  aggregateSnapshotInputs,
  computeLiveKpis,
  formatInvestorReportText,
  getMarketplaceMetrics,
  utcDayStart,
} from "@/src/modules/investor-metrics/metricsEngine";
import { buildMetricSnapshotsCsv } from "@/src/modules/investor-metrics/investorExport";
import { getRecentMetricSnapshots } from "@/src/modules/investor-metrics/metricsSnapshot";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return Response.json({ error: "Forbidden" }, { status: 403 });

  const format = req.nextUrl.searchParams.get("format") ?? "csv";
  const now = new Date();

  if (format === "report" || format === "text") {
    const snap = await aggregateSnapshotInputs(now);
    const kpis = await computeLiveKpis(now);
    const marketplace = await getMarketplaceMetrics(now);
    const body = formatInvestorReportText({
      snapshotDate: utcDayStart(now).toISOString().slice(0, 10),
      snapshot: snap,
      kpis,
      marketplace,
    });
    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="lecipm-investor-report-${utcDayStart(now).toISOString().slice(0, 10)}.txt"`,
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
