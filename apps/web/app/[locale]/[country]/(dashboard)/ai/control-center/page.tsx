import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getAutonomyEngineSnapshot } from "@/lib/ai/autonomy/autonomy-engine";
import { AIHealthBadge } from "@/components/ai/AIHealthBadge";

const GOLD = "#D4AF37";

export default async function AiControlCenterPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/ai/control-center");
  const admin = await isPlatformAdmin(userId);
  if (!admin) redirect("/ai");

  const snap = await getAutonomyEngineSnapshot();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-white">AI control center</h1>
        <p className="mt-1 text-sm text-white/50">Autonomy state, kill switch, and quick links (admin).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#141414] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
            Mode
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">{snap.normalizedMode}</p>
          <p className="mt-1 text-xs text-white/45">Stored setting: {snap.globalMode}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#141414] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
            Status
          </p>
          <div className="mt-3">
            <AIHealthBadge killSwitch={snap.globalKillSwitch} pausedUntil={snap.autonomyPausedUntil} />
          </div>
          <p className="mt-3 text-xs text-white/50">
            Automations: {snap.automationsEnabled ? "enabled" : "disabled"} · Use AI settings to change mode and kill
            switch.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/ai/settings"
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-black"
          style={{ backgroundColor: GOLD }}
        >
          Open AI settings
        </Link>
        <Link
          href="/ai/automations"
          className="rounded-xl border border-white/20 px-5 py-2.5 text-sm text-white/85 hover:bg-white/5"
        >
          Automations
        </Link>
        <Link
          href="/ai/overrides"
          className="rounded-xl border border-white/20 px-5 py-2.5 text-sm text-white/85 hover:bg-white/5"
        >
          Override log
        </Link>
      </div>
    </div>
  );
}
