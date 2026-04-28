import { prisma } from "@/lib/db";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { normalizeSy8ReportReason, type Sy8ReportReasonKey } from "@/lib/sy8/sy8-constants";
import { applySy8ReportThresholds } from "@/lib/sy8/sy8-report-threshold";
import { recordSybnbEvent, SYBNB_ANALYTICS_EVENT_TYPES } from "@/lib/sybnb/sybnb-analytics-events";
import { logTimelineEvent } from "@/lib/timeline/log-event";

export type SybnbListingReportSubmitError = "not_found" | "self_report" | "not_stay";

/**
 * Creates a `ListingReport` row (`sybnb_listing_reports`) and runs SY8 threshold / revalidation. Pass `reporterId` from a verified session.
 */
export async function submitSybnbListingReportCore(input: {
  reporterId: string;
  propertyId: string;
  reason: string;
}): Promise<
  { ok: true; propertyId: string } | { ok: false; error: SybnbListingReportSubmitError }
> {
  const propertyId = input.propertyId.trim();
  if (!propertyId) {
    return { ok: false, error: "not_found" };
  }
  const reason: Sy8ReportReasonKey = normalizeSy8ReportReason(input.reason);

  const p = await prisma.syriaProperty.findUnique({ where: { id: propertyId } });
  if (!p) {
    return { ok: false, error: "not_found" };
  }
  if (p.category !== "stay") {
    return { ok: false, error: "not_stay" };
  }
  if (p.ownerId === input.reporterId) {
    return { ok: false, error: "self_report" };
  }

  const reportRow = await prisma.listingReport.create({
    data: {
      listingId: propertyId,
      reporterId: input.reporterId,
      reason,
    },
  });

  void recordSybnbEvent({
    type: SYBNB_ANALYTICS_EVENT_TYPES.REPORT_SUBMITTED,
    listingId: propertyId,
    userId: input.reporterId,
    metadata: { reportId: reportRow.id, reason },
  });
  void logTimelineEvent({
    entityType: "syria_property",
    entityId: propertyId,
    action: "sybnb_listing_report_submitted",
    actorId: input.reporterId,
    actorRole: "guest",
    metadata: { reportId: reportRow.id, reasonKey: reason },
  });
  await applySy8ReportThresholds(propertyId);
  await revalidateSyriaPaths(
    "/sybnb",
    "/sybnb/listings",
    `/sybnb/listings/${propertyId}`,
    "/admin/sybnb/reports",
    "/",
    "/listing",
  );

  return { ok: true, propertyId };
}
