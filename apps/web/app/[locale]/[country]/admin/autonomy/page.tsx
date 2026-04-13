import Link from "next/link";
import type { AutonomyMode } from "@/lib/autonomy/types";
import { getManagerAiPlatformSettings } from "@/lib/manager-ai/platform-settings";
import { AutonomyControlsClient } from "./autonomy-controls-client";

export const dynamic = "force-dynamic";

const MODES: Array<{ mode: AutonomyMode; summary: string }> = [
  { mode: "OFF", summary: "No automated side effects; monitoring and manual ops only." },
  { mode: "ASSIST", summary: "Suggestions only — human approves every change." },
  { mode: "SAFE_AUTOPILOT", summary: "Low-risk actions (content, SEO hints, safe notifications) may run automatically." },
  {
    mode: "FULL_WITH_APPROVAL",
    summary: "Same auto lane as safe autopilot for low risk; medium risk queues for approval; high risk and payments never auto.",
  },
];

const PLATFORM_EQUIV: Array<{ product: AutonomyMode; settings: string }> = [
  { product: "OFF", settings: "OFF" },
  { product: "ASSIST", settings: "ASSIST_ONLY (or ASSISTANT legacy)" },
  { product: "SAFE_AUTOPILOT", settings: "SAFE_AUTOPILOT / AUTONOMOUS_SAFE" },
  { product: "FULL_WITH_APPROVAL", settings: "APPROVAL_AUTOPILOT / AUTONOMOUS_MAX_WITH_OVERRIDE" },
];

export default async function AdminAutonomyPage() {
  const settings = await getManagerAiPlatformSettings();
  const controlsInitial = {
    globalMode: settings.globalMode,
    automationsEnabled: settings.automationsEnabled,
    notifyOnApproval: settings.notifyOnApproval,
    globalKillSwitch: settings.globalKillSwitch,
    autonomyPausedUntil: settings.autonomyPausedUntil?.toISOString() ?? null,
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Marketplace autonomy</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Levels 3–5: <code className="text-slate-300">lib/autonomy</code> +{" "}
          <code className="text-slate-300">lib/system-brain</code> enforce risk tiers; live platform mode is stored in
          Manager AI settings and mirrored below.
        </p>

        <AutonomyControlsClient initial={controlsInitial} />

        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-slate-200">Product vocabulary ↔ platform settings</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            {PLATFORM_EQUIV.map((row) => (
              <li key={row.product} className="flex flex-wrap gap-x-2">
                <span className="font-mono text-amber-200/90">{row.product}</span>
                <span className="text-slate-600">→</span>
                <span>{row.settings}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-emerald-200">Autonomy modes</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {MODES.map(({ mode, summary }) => (
              <li key={mode} className="rounded-lg border border-slate-800/80 bg-slate-950/50 px-4 py-3">
                <span className="font-mono text-amber-200">{mode}</span>
                <p className="mt-1 text-slate-400">{summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-xl border border-rose-900/40 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-rose-200/90">Hard guardrails</h2>
          <p className="mt-2 text-sm text-slate-400">
            Autonomous execution never covers: moving money, confirming payments, resolving disputes, or sending risky legal
            messages. Syria / manual-payment flows stay human-first.
          </p>
        </section>

        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold text-slate-200">Related surfaces</h2>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-emerald-400">
            <li>
              <Link href="/admin/controls" className="hover:text-emerald-300">
                Operational controls (flags, kill switches)
              </Link>
            </li>
            <li>
              <Link href="/admin/monitoring" className="hover:text-emerald-300">
                Monitoring & health
              </Link>
            </li>
            <li>
              <Link href="/admin/autonomous-system" className="hover:text-emerald-300">
                Autonomous system (events, cron, briefing)
              </Link>
            </li>
            <li>
              <Link href="/admin/intelligence" className="hover:text-emerald-300">
                Autopilot intelligence
              </Link>
            </li>
            <li>
              <Link href="/admin/revenue" className="hover:text-emerald-300">
                Revenue & monetization snapshot
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
