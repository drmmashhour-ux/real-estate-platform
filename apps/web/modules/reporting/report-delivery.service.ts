import { Prisma } from "@prisma/client";
import type { ReportDeliveryLog } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { getRevenueDashboardSummary } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";

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
