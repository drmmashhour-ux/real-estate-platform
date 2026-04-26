"use server";

import { revalidatePath } from "next/cache";
import { getGuestId } from "@/lib/auth/session";
import { isComplianceOversightStaff } from "@/lib/admin/compliance-access";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export async function createRegulatorCorrespondenceAction(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await getGuestId();
  if (!userId) return { ok: false, error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!isComplianceOversightStaff(user?.role)) return { ok: false, error: "Forbidden" };

  const regulatorKey = String(formData.get("regulatorKey") ?? "").trim() || "oaciq";
  const channel = String(formData.get("channel") ?? "").trim() || "email";
  const status = String(formData.get("status") ?? "").trim() || "draft";
  const subject = String(formData.get("subject") ?? "").trim() || null;
  const outboundSummary = String(formData.get("outboundSummary") ?? "").trim() || null;
  const inboundSummary = String(formData.get("inboundSummary") ?? "").trim() || null;
  const feedbackNotes = String(formData.get("feedbackNotes") ?? "").trim() || null;
  const recommendations = String(formData.get("recommendations") ?? "").trim() || null;
  const occurredAtRaw = String(formData.get("occurredAt") ?? "").trim();
  const occurredAt = occurredAtRaw ? new Date(occurredAtRaw) : null;

  await prisma.complianceRegulatorCorrespondence.create({
    data: {
      regulatorKey,
      channel,
      status,
      subject,
      outboundSummary,
      inboundSummary,
      feedbackNotes,
      recommendations,
      occurredAt: occurredAt && !Number.isNaN(occurredAt.getTime()) ? occurredAt : null,
      createdByUserId: userId,
    },
  });

  revalidatePath("/admin/compliance/regulator");
  return { ok: true };
}
