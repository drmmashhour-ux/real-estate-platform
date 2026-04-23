"use server";

import { revalidatePath } from "next/cache";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { refreshLeadSignalsFromTelemetry } from "@/lib/crm/internal-crm-telemetry";
import { recalculateLeadLecipmScores } from "@/modules/crm/application/recalculateLeadLecipmScores";
export async function adminRefreshLeadCrmSignals(leadId: string): Promise<{ ok: boolean; error?: string }> {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) {
    return { ok: false, error: "Unauthorized" };
  }
  try {
    await refreshLeadSignalsFromTelemetry(leadId);
    await recalculateLeadLecipmScores(prisma, leadId).catch(() => {});
    revalidatePath("/admin/crm/internal");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
