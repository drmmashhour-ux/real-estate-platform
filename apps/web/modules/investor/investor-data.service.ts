import { prisma } from "@/lib/db";
import { normalizeInvestorEmail } from "@/modules/investor/auth/investor-auth";
import { loadReportData } from "@/modules/reporting/report-data-loader.service";

export type InvestorDashboardReportRow = {
  id: string;
  createdAt: Date;
  channel: string | null;
  meta: unknown;
  /** Present when a PDF was persisted for this delivery (download API available). */
  hasPdf: boolean;
};

/**
 * BNHub-facing investor dashboard: live KPIs + narrative for the investor’s scope, plus historical **success**
 * deliveries (PDF paths never returned — use download API with opaque id).
 */
export async function getInvestorDashboard(email: string | null | undefined) {
  if (!email?.trim()) {
    throw new Error("Unauthorized");
  }

  const investor = await prisma.investorAccess.findUnique({
    where: { email: normalizeInvestorEmail(email) },
  });

  if (!investor || !investor.isActive) {
    throw new Error("Unauthorized");
  }

  const data = await loadReportData(investor.scopeType, investor.scopeId);

  const raw = await prisma.reportDeliveryLog.findMany({
    where: {
      scopeType: investor.scopeType,
      scopeId: investor.scopeId,
      status: "success",
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      createdAt: true,
      channel: true,
      meta: true,
      pdfPath: true,
    },
  });

  const reports: InvestorDashboardReportRow[] = raw.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    channel: r.channel,
    meta: r.meta,
    hasPdf: Boolean(r.pdfPath),
  }));

  return {
    investor,
    summary: data.summary,
    narrative: data.narrative,
    reports,
  };
}
