import type { NextRequest } from "next/server";
import { runBnhubScheduledInvestorReportArchives } from "@/modules/reporting/report-delivery.service";

export const dynamic = "force-dynamic";

/**
 * GET/POST `/api/cron/bnhub-investor-report-archive`
 * Generates BNHub investor PDFs for each distinct active `InvestorAccess` scope, persists files under
 * `BNHUB_REPORT_ARCHIVE_DIR` (or `.data/bnhub-report-pdfs`), and inserts `ReportDeliveryLog` rows with KPI meta.
 *
 * Vercel Cron uses GET + `Authorization: Bearer $CRON_SECRET`.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBnhubScheduledInvestorReportArchives();
    return Response.json({ ok: true, ...result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "bnhub_investor_report_archive_failed";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
