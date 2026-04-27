"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { setLaunchPlanStartAt, updateLaunchTask } from "@/lib/launch/progress";
import { trackEvent } from "@/src/services/analytics";

type ToggleInput = {
  day: number;
  taskIndex: number;
  completed: boolean;
  /** e.g. `/en/ca` — revalidates `…/dashboard/admin/launch` and `…/dashboard` */
  localeCountryBase: string;
};

/**
 * Toggles a single checklist row for the signed-in user. No `launchPlan` mutation — DB rows only.
 */
export async function toggleLaunchTaskAction(input: ToggleInput): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdminSession();
  if (!admin.ok) return { ok: false, error: "Admin session required" };
  const userId = admin.userId;
  const base = input.localeCountryBase.replace(/\/$/, "");
  try {
    await updateLaunchTask(userId, input.day, input.taskIndex, input.completed);
  } catch (e) {
    console.error("[toggleLaunchTaskAction]", e);
    return { ok: false, error: "Update failed" };
  }
  if (input.completed) {
    void trackEvent("launch_task_completed", { day: input.day, taskIndex: input.taskIndex }).catch(() => {});
  }
  revalidatePath(`${base}/dashboard/admin/launch`);
  revalidatePath(`${base}/dashboard`);
  return { ok: true };
}

export async function setLaunchStartDateFormAction(
  _prev: unknown,
  formData: FormData
): Promise<void> {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    redirect("/auth/login?next=%2Fdashboard%2Fadmin%2Flaunch");
  }
  const userId = admin.userId;
  const raw = String(formData.get("start") ?? "").trim();
  const base = String(formData.get("localeCountryBase") ?? "").replace(/\/$/, "");
  if (!raw) {
    await setLaunchPlanStartAt(userId, null);
  } else {
    const t = new Date(raw);
    if (!Number.isNaN(t.getTime())) {
      t.setHours(0, 0, 0, 0);
      await setLaunchPlanStartAt(userId, t);
    }
  }
  revalidatePath(`${base}/dashboard/admin/launch`);
  revalidatePath(`${base}/dashboard`);
  redirect(`${base}/dashboard/admin/launch?day=1`);
}
