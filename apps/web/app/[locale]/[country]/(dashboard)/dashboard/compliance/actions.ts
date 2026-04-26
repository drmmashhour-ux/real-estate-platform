"use server";

import { revalidatePath } from "next/cache";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export async function resolveOaciqAlignmentEventAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await getGuestId();
  if (!userId) return { ok: false, error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== PlatformRole.BROKER && user?.role !== PlatformRole.ADMIN) {
    return { ok: false, error: "Forbidden" };
  }

  const locale = String(formData.get("locale") ?? "").trim() || "en";
  const country = String(formData.get("country") ?? "").trim() || "ca";

  const eventId = String(formData.get("eventId") ?? "").trim();
  const resolutionNote = String(formData.get("resolutionNote") ?? "").trim();
  if (!eventId) return { ok: false, error: "eventId required" };

  const existing = await prisma.oaciqComplianceAlignmentEvent.findUnique({
    where: { id: eventId },
    select: { brokerId: true },
  });
  if (!existing) return { ok: false, error: "Not found" };
  if (user.role !== PlatformRole.ADMIN && existing.brokerId !== userId) {
    return { ok: false, error: "Forbidden" };
  }

  await prisma.oaciqComplianceAlignmentEvent.update({
    where: { id: eventId },
    data: {
      resolvedAt: new Date(),
      resolutionNote: resolutionNote || null,
    },
  });

  revalidatePath(`/${locale}/${country}/dashboard/compliance`);
  return { ok: true };
}
