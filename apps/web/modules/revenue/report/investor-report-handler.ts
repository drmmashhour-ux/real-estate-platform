import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getPricingImpactSummary } from "@/modules/bnhub-revenue/bnhub-pricing-impact.service";
import { getRevenueDashboardSummary } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";
import { getDailyRevenueTrend } from "@/modules/bnhub-revenue/bnhub-revenue-trend.service";
import { generateHostRevenueNarrative } from "@/modules/revenue/narrative/narrative-generator.service";
import {
  generateBnhubInvestorReportPdf,
  jsonSafePayload,
  readPdfFile,
  safeUnlink,
} from "@/modules/revenue/report/pdf-report.service";

/** Shared GET handler for BNHub investor PDF — session-scoped host only (no `userId` query; avoids impersonation). */
export async function handleInvestorReportGet(): Promise<Response> {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [summary, trend, pricingImpact, narrative] = await Promise.all([
    getRevenueDashboardSummary(userId),
    getDailyRevenueTrend(userId, 30),
    getPricingImpactSummary(userId),
    generateHostRevenueNarrative(userId, { persist: false }),
  ]);

  const payload = jsonSafePayload({
    generatedAt: new Date().toISOString(),
    meta: {
      source: "BNHub analytics",
      periodNote:
        "Portfolio KPIs: last 30 UTC days (check-in window). Trend: booking creation dates, 30 UTC days.",
      disclaimer:
        "Generated from BNHub analytics — deterministic metrics from platform data; not financial advice.",
    },
    summary,
    trend,
    pricingImpact,
    narrative,
  });

  let pdfPath: string | null = null;
  try {
    pdfPath = await generateBnhubInvestorReportPdf(payload);
    const buf = readPdfFile(pdfPath);
    return new Response(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="BNHub_Report.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        error: "PDF generation unavailable",
        detail,
      },
      { status: 503 }
    );
  } finally {
    if (pdfPath) safeUnlink(pdfPath);
  }
}
