/**
 * ORDER SYBNB-92 — marketplace listing reports (`SyriaListingReport`) + SY8 thresholds.
 * Distinct from SYBNB stay reports (`ListingReport` / `sybnb_listing_reports`).
 */
import { prisma } from "@/lib/db";
import { applySy8ReportThresholds } from "@/lib/sy8/sy8-report-threshold";

/** Reasons accepted by `POST /api/listings/[id]/report` (JSON body). */
export const MARKETPLACE_REPORT_REASONS = ["spam", "fake", "wrong_info", "other"] as const;
export type MarketplaceReportReason = (typeof MARKETPLACE_REPORT_REASONS)[number];

export function normalizeMarketplaceReportReason(raw: unknown): MarketplaceReportReason | null {
  const s = typeof raw === "string" ? raw.trim() : "";
  return (MARKETPLACE_REPORT_REASONS as readonly string[]).includes(s) ? (s as MarketplaceReportReason) : null;
}

export async function submitSyriaPropertyListingReport(input: {
  propertyId: string;
  reporterId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: "not_found" | "self_report" }> {
  const propertyId = input.propertyId.trim();
  if (!propertyId) {
    return { ok: false, error: "not_found" };
  }
  const p = await prisma.syriaProperty.findUnique({
    where: { id: propertyId },
    select: { id: true, ownerId: true },
  });
  if (!p) {
    return { ok: false, error: "not_found" };
  }
  if (p.ownerId === input.reporterId) {
    return { ok: false, error: "self_report" };
  }

  await prisma.syriaListingReport.create({
    data: {
      propertyId,
      reporterId: input.reporterId,
      reason: input.reason.slice(0, 120),
    },
  });
  await applySy8ReportThresholds(propertyId);
  return { ok: true };
}
