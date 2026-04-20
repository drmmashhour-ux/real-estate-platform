import { copyFileSync, mkdirSync } from "fs";
import path from "path";
import { Prisma } from "@prisma/client";
import type { ReportDeliveryLog } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { getRevenueDashboardSummary } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";
import { resolveBnhubScopeToHostUserId } from "@/modules/reporting/report-data-loader.service";
import { buildBnhubInvestorReportPayload } from "@/modules/revenue/report/bnhub-investor-report-payload";
import {
  generateBnhubInvestorReportPdf,
  safeUnlink,
} from "@/modules/revenue/report/pdf-report.service";

/** Point-in-time KPIs stored on each delivery for investor performance history (no fabrication). */
export type BnhubReportDeliveryMeta = {
  revenue: number;
  bookings: number;
  occupancyRate?: number;
  adr?: number;
  revpar?: number;
};

export function buildBnhubReportMetaFromSummary(
  summary: Awaited<ReturnType<typeof getRevenueDashboardSummary>>
): BnhubReportDeliveryMeta {
  const p = summary.portfolio;
  return {
    revenue: p.grossRevenue,
    bookings: p.bookingCount,
    occupancyRate: p.occupancyRate,
    adr: p.adr,
    revpar: p.revpar,
  };
}

/** Call from scheduled email / cron after a PDF is written to disk (or pass `pdfPath: null` on email-only stub). */
export async function recordSuccessfulBnhubReportDelivery(opts: {
  scopeType: string;
  scopeId: string;
  pdfPath: string | null;
  summary: Awaited<ReturnType<typeof getRevenueDashboardSummary>>;
  channel?: string;
}): Promise<ReportDeliveryLog> {
  return prisma.reportDeliveryLog.create({
    data: {
      scopeType: opts.scopeType,
      scopeId: opts.scopeId,
      status: "success",
      channel: opts.channel ?? "scheduled",
      pdfPath: opts.pdfPath,
      meta: buildBnhubReportMetaFromSummary(opts.summary) as Prisma.InputJsonValue,
    },
  });
}

function resolveBnhubReportArchiveDir(): string {
  const fromEnv = process.env.BNHUB_REPORT_ARCHIVE_DIR?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.join(process.cwd(), ".data", "bnhub-report-pdfs");
}

/** Move PDF from Python temp output into durable server storage for investor download API. */
export function archiveBnhubPdfFromTemp(tempPdfPath: string): string {
  const dir = resolveBnhubReportArchiveDir();
  mkdirSync(dir, { recursive: true });
  const name = `bnhub-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.pdf`;
  const dest = path.join(dir, name);
  copyFileSync(tempPdfPath, dest);
  safeUnlink(tempPdfPath);
  return dest;
}

/**
 * Generate BNHub investor PDF + persist path + write `ReportDeliveryLog` with snapshot KPI meta.
 * Used by cron; on-demand host download still streams from temp only (see `investor-report-handler`).
 */
export async function deliverBnhubReportForScope(opts: {
  scopeType: string;
  scopeId: string;
  channel: string;
  /** Skip when a success exists within this window (default ~23h). Pass `0` to force. */
  minMsSinceLastSuccess?: number;
}): Promise<
  | { ok: true; log: ReportDeliveryLog }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; error: string }
> {
  const hostUserId = resolveBnhubScopeToHostUserId(opts.scopeType, opts.scopeId);
  const minMs = opts.minMsSinceLastSuccess ?? 23 * 60 * 60 * 1000;

  if (minMs > 0) {
    const recent = await prisma.reportDeliveryLog.findFirst({
      where: {
        scopeType: opts.scopeType,
        scopeId: opts.scopeId,
        status: "success",
        createdAt: { gte: new Date(Date.now() - minMs) },
      },
      select: { id: true },
    });
    if (recent) {
      return { ok: false, skipped: true, reason: "recent_delivery_exists" };
    }
  }

  const built = await buildBnhubInvestorReportPayload(hostUserId);
  if (!built.ok) {
    return { ok: false, error: built.detail ? `${built.error} ${built.detail}` : built.error };
  }

  let tempPath: string | null = null;
  try {
    tempPath = await generateBnhubInvestorReportPdf(built.payload);
    const persisted = archiveBnhubPdfFromTemp(tempPath);
    tempPath = null;
    const log = await recordSuccessfulBnhubReportDelivery({
      scopeType: opts.scopeType,
      scopeId: opts.scopeId,
      pdfPath: persisted,
      summary: built.summary,
      channel: opts.channel,
    });
    return { ok: true, log };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  } finally {
    if (tempPath) safeUnlink(tempPath);
  }
}

/** One archived PDF + snapshot row per active investor scope (deduped within ~23h per scope). */
export async function runBnhubScheduledInvestorReportArchives(): Promise<{
  scopes: number;
  delivered: number;
  skipped: number;
  failed: { scopeType: string; scopeId: string; error: string }[];
}> {
  const grouped = await prisma.investorAccess.groupBy({
    by: ["scopeType", "scopeId"],
    where: { isActive: true },
  });

  let delivered = 0;
  let skipped = 0;
  const failed: { scopeType: string; scopeId: string; error: string }[] = [];

  for (const row of grouped) {
    const result = await deliverBnhubReportForScope({
      scopeType: row.scopeType,
      scopeId: row.scopeId,
      channel: "scheduled",
    });
    if (result.ok) delivered += 1;
    else if ("skipped" in result && result.skipped) skipped += 1;
    else if ("error" in result && result.error) {
      failed.push({ scopeType: row.scopeType, scopeId: row.scopeId, error: result.error });
    }
  }

  return { scopes: grouped.length, delivered, skipped, failed };
}
