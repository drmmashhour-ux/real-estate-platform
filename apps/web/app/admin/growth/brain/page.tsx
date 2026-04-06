import Link from "next/link";
import { GrowthBrainDashboardClient } from "@/components/growth-brain/GrowthBrainDashboardClient";
import { getGrowthAutomationModeFromEnv } from "@/lib/growth-brain/rules";

export const dynamic = "force-dynamic";

export default function GrowthBrainPage() {
  const mode = getGrowthAutomationModeFromEnv();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-400">AI Growth Brain</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Growth brain</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-400">
        Automated opportunity detection and prioritization. High-impact actions (pricing, publishing, external sends)
        stay operator-gated. Set <code className="text-slate-500">GROWTH_BRAIN_AUTOMATION_MODE</code> (OFF | ASSIST |
        SAFE_AUTOPILOT | FULL_WITH_APPROVAL).
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/admin/growth/pipeline" className="text-emerald-400 hover:text-emerald-300">
          ← Growth CRM pipeline
        </Link>
        <Link href="/admin/growth" className="text-slate-400 hover:text-slate-300">
          Growth home
        </Link>
      </div>
      <div className="mt-10">
        <GrowthBrainDashboardClient initialMode={mode} />
      </div>
    </main>
  );
}
