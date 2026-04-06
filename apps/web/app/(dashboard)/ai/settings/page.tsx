import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getManagerAiPlatformSettings } from "@/lib/manager-ai/platform-settings";
import { AiSettingsClient } from "./ai-settings-client";

export default async function AiSettingsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/ai/settings");
  if (!(await isPlatformAdmin(userId))) redirect("/ai");

  const s = await getManagerAiPlatformSettings();
  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold text-white">AI settings</h1>
      <p className="mb-6 text-sm text-white/50">Global autopilot mode for LECIPM Manager (admin only).</p>
      <AiSettingsClient initial={s} />
    </div>
  );
}
