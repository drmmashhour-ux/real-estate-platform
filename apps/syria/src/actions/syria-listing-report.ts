"use server";

import { requireSessionUser } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { normalizeSy8ReportReason } from "@/lib/sy8/sy8-constants";
import { submitSyriaPropertyListingReport } from "@/lib/syria/property-listing-report";

export async function createSyriaListingReport(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  const user = await requireSessionUser();
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  const reason = normalizeSy8ReportReason(String(formData.get("reason") ?? "wrong_info"));
  if (!propertyId) return;

  const res = await submitSyriaPropertyListingReport({
    propertyId,
    reporterId: user.id,
    reason,
  });
  if (!res.ok) {
    return;
  }
  await revalidateSyriaPaths("/", "/listing", `/listing/${propertyId}`);
}
