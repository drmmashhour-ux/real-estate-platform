"use server";

import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { normalizeSy8ReportReason } from "@/lib/sy8/sy8-constants";
import { applySy8ReportThresholds } from "@/lib/sy8/sy8-report-threshold";

export async function createSyriaListingReport(formData: FormData): Promise<void> {
  assertDarlinkRuntimeEnv();
  const user = await requireSessionUser();
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  const reason = normalizeSy8ReportReason(String(formData.get("reason") ?? "wrong_info"));
  if (!propertyId) return;

  const p = await prisma.syriaProperty.findUnique({ where: { id: propertyId } });
  if (!p || p.ownerId === user.id) return;

  await prisma.syriaListingReport.create({
    data: { propertyId, reporterId: user.id, reason },
  });
  await applySy8ReportThresholds(propertyId);
  await revalidateSyriaPaths("/", "/listing", `/listing/${propertyId}`);
}
