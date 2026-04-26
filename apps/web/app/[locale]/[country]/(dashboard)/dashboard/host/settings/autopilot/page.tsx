import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getHostAutopilotConfig } from "@/lib/ai/autopilot/host-config";
import { HostAutopilotCoreSettings } from "@/components/host/HostAutopilotCoreSettings";

export const dynamic = "force-dynamic";

export default async function HostAutopilotSettingsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/host/settings/autopilot");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, _count: { select: { shortTermListings: true } } },
  });
  if (!user) redirect("/auth/login");

  const isHostish = user.role === "HOST" || user.role === "ADMIN" || user._count.shortTermListings > 0;
  if (!isHostish) redirect("/dashboard");

  const settings = await getHostAutopilotConfig(userId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-slate-200">
      <Link href="/dashboard/host" className="text-sm text-amber-500/90 hover:text-amber-400">
        ← Host hub
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-white">Autopilot settings</h1>
      <p className="mt-2 text-sm text-slate-500">
        Control modes and capabilities. For guest messaging templates, approval queue, and live suggestions, open the{" "}
        <Link href="/dashboard/host/autopilot" className="text-amber-400 hover:text-amber-300">
          full AI Autopilot console
        </Link>
        .
      </p>

      <div className="mt-8">
        <HostAutopilotCoreSettings
          initialSettings={{
            autopilotEnabled: settings.autopilotEnabled,
            autopilotMode: settings.autopilotMode,
            preferences: settings.preferences,
          }}
          heading="Preferences"
        />
      </div>
    </div>
  );
}
