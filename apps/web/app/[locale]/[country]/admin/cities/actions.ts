"use server";

import { revalidatePath } from "next/cache";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";
import { launchCity, refreshAllCityExpansionScores } from "@/modules/multi-city/cityLaunch";

export type CityAdminActionState = { ok: boolean; error?: string };

async function assertAdmin(): Promise<boolean> {
  const userId = await getGuestId();
  return Boolean(userId && (await isPlatformAdmin(userId)));
}

export async function launchCityAction(_prev: CityAdminActionState | void, formData: FormData): Promise<CityAdminActionState> {
  if (!(await assertAdmin())) return { ok: false, error: "Unauthorized" };
  const id = String(formData.get("cityId") ?? "").trim();
  if (!id) return { ok: false, error: "Missing city" };
  try {
    await launchCity(prisma, id);
    revalidatePath("/admin/cities");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Launch failed";
    return { ok: false, error: msg };
  }
}

export async function refreshCityScoresAction(): Promise<CityAdminActionState> {
  if (!(await assertAdmin())) return { ok: false, error: "Unauthorized" };
  try {
    await refreshAllCityExpansionScores(prisma);
    revalidatePath("/admin/cities");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Refresh failed";
    return { ok: false, error: msg };
  }
}
