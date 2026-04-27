"use server";

import { requireSessionUser } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { submitSybnbListingReportCore } from "@/lib/sybnb/submit-sybnb-listing-report";
import { s2GetClientIpFromRequestHeaders } from "@/lib/security/s2-ip";
import { sybnbCheck5PerMin } from "@/lib/sybnb/sybnb-rate-5per-min";
import { normalizeSy8ReportReason } from "@/lib/sy8/sy8-constants";

/** SYBNB-7: same 5 req/min as POST /api/sybnb/listings/[id]/report (per IP from headers). */
export async function createSybnbListingReport(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  assertDarlinkRuntimeEnv();
  const user = await requireSessionUser();
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  if (!propertyId) {
    return { ok: false, error: "propertyId is required" };
  }

  const ip = await s2GetClientIpFromRequestHeaders();
  if (!sybnbCheck5PerMin(`sybnb:listing_report:${ip}`).ok) {
    return { ok: false, error: "Too many requests. Try again in a moment." };
  }

  const reason = normalizeSy8ReportReason(String(formData.get("reason") ?? "wrong_info"));
  const res = await submitSybnbListingReportCore({ reporterId: user.id, propertyId, reason });
  if (!res.ok) {
    return { ok: false, error: res.error };
  }
  return { ok: true };
}
