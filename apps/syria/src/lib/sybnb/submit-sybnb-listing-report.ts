import { prisma } from "@/lib/db";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { normalizeSy8ReportReason, type Sy8ReportReasonKey } from "@/lib/sy8/sy8-constants";
import { applySy8ReportThresholds } from "@/lib/sy8/sy8-report-threshold";

export type SybnbListingReportSubmitError = "not_found" | "self_report" | "not_stay";

/**
 * Creates a `SybnbListingReport` and runs SY8 threshold / revalidation. No auth — pass `reporterId` from a verified session.
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

  await prisma.sybnbListingReport.create({
    data: {
      propertyId,
      reporterId: input.reporterId,
      reason,
    },
  });
  console.log("[SYBNB] listing report submitted", { propertyId, reporterId: input.reporterId, reason });
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
