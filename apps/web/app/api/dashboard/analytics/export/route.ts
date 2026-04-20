import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { computeUnifiedAnalytics } from "@/modules/analytics/unified-analytics/analytics.service";
import { resolveUnifiedAnalyticsAccess } from "@/modules/analytics/unified-analytics/unified-analytics-access";
import type { UnifiedAnalyticsRangePreset } from "@/modules/analytics/unified-analytics/unified-analytics.types";

export const dynamic = "force-dynamic";

function parsePreset(raw: string | null): UnifiedAnalyticsRangePreset {
  if (raw === "7d" || raw === "90d") return raw;
  return "30d";
}

function toCsv(payload: Awaited<ReturnType<typeof computeUnifiedAnalytics>>): string {
  const lines: string[] = [];
  lines.push("metric,value");
  lines.push(`generatedAt,${payload.generatedAt}`);
  lines.push(`range,${payload.range.from}_${payload.range.toExclusive}`);
  lines.push(`totalUsers,${payload.kpis.totalUsers}`);
  lines.push(`activeUsers,${payload.kpis.activeUsers}`);
  lines.push(`leadsGenerated,${payload.kpis.leadsGenerated}`);
  lines.push(`conversionRate,${payload.kpis.conversionRate}`);
  lines.push(`revenueCents,${payload.kpis.revenueCents}`);
  lines.push(`revenuePerLeadCents,${payload.kpis.revenuePerLeadCents ?? ""}`);
  lines.push(`cacCents,${payload.kpis.cacCents ?? ""}`);
  lines.push(`ltvCents,${payload.kpis.ltvCents ?? ""}`);
  lines.push(`churnRate,${payload.kpis.churnRate ?? ""}`);
  lines.push(`leadQualityScore,${payload.kpis.leadQualityScore ?? ""}`);
  lines.push("");
  lines.push("date,revenueCents,leads");
  const n = Math.max(payload.revenueSeries.length, payload.leadSeries.length);
  for (let i = 0; i < n; i++) {
    const r = payload.revenueSeries[i]?.value ?? "";
    const l = payload.leadSeries[i]?.value ?? "";
    const d = payload.revenueSeries[i]?.date ?? payload.leadSeries[i]?.date ?? "";
    lines.push(`${d},${r},${l}`);
  }
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const viewerId = await getGuestId();
    if (!viewerId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const access = await resolveUnifiedAnalyticsAccess(viewerId);
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason ?? "Forbidden" }, { status: 403 });
    }

    const format = req.nextUrl.searchParams.get("format") ?? "csv";
    const range = parsePreset(req.nextUrl.searchParams.get("range"));

    const { prisma } = await import("@/lib/db");
    const user = await prisma.user.findUnique({
      where: { id: viewerId },
      select: { role: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const payload = await computeUnifiedAnalytics({
      viewerId,
      role: user.role,
      view: access.view,
      rangePreset: range,
    });

    if (format === "json") {
      return NextResponse.json(payload);
    }

    const csv = toCsv(payload);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="lecipm-analytics-${payload.range.preset}.csv"`,
      },
    });
  } catch (e) {
    console.error("[dashboard/analytics/export]", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
