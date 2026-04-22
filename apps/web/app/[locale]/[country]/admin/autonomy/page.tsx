import Link from "next/link";
import type { AutonomyMode } from "@/lib/autonomy/types";
import { engineFlags } from "@/config/feature-flags";
import { ControlledExecutionPanel } from "@/components/autonomy/admin/ControlledExecutionPanel";
import { RegionExecutionCapabilityNote } from "@/components/autonomy/admin/RegionExecutionCapabilityNote";
import { getRegionExecutionAvailabilityNote } from "@/modules/autonomous-marketplace/execution/region-safe-execution.service";
import { getManagerAiPlatformSettings } from "@/lib/manager-ai/platform-settings";
import { AutonomyControlsClient } from "./autonomy-controls-client";
import { GovernanceFeedbackPanel } from "@/modules/autonomous-marketplace/components/autonomy/admin/GovernanceFeedbackPanel";
import { GovernanceIntelligencePanel } from "@/modules/autonomous-marketplace/components/autonomy/admin/GovernanceIntelligencePanel";
import { PolicySimulationPanel } from "@/modules/autonomous-marketplace/components/autonomy/admin/PolicySimulationPanel";
import { PolicyProposalPanel } from "@/modules/autonomous-marketplace/components/autonomy/admin/PolicyProposalPanel";
import { autonomyConfig } from "@/modules/autonomous-marketplace/config/autonomy.config";

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

        <ControlledExecutionPanel />

        {engineFlags.autonomousMarketplaceV1 && autonomyConfig.enabled ? (
          <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-slate-200">Governance outcome feedback</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Advisory KPIs from classified outcomes — same payload as GET{" "}
              <code className="rounded bg-slate-950/80 px-1 py-0.5 text-xs text-slate-300">
                /api/admin/autonomy/governance-feedback
              </code>
              .
            </p>
            <div className="mt-4">
              <GovernanceFeedbackPanel />
            </div>
            <h3 className="mt-8 text-base font-semibold text-slate-200">Intelligence signals</h3>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Hotspots (clustered outcomes with leakage) and drift (recent vs baseline harmful rate). Uses live feedback when
              present; otherwise optional demo rows via <code className="text-slate-300">?demo=1</code> on GET{" "}
              <code className="rounded bg-slate-950/80 px-1 py-0.5 text-xs text-slate-300">
                /api/admin/autonomy/governance-intelligence
              </code>
              .
            </p>
            <div className="mt-4">
              <GovernanceIntelligencePanel />
            </div>
            <h3 className="mt-8 text-base font-semibold text-slate-200">Policy simulation (what-if)</h3>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Multi-scenario score-threshold comparison with live delta vs baseline. Data:{" "}
              <code className="rounded bg-slate-950/80 px-1 py-0.5 text-xs text-slate-300">
                GET /api/admin/autonomy/policy-simulation
              </code>
              .
            </p>
            <div className="mt-4">
              <PolicySimulationPanel />
            </div>
            <h3 className="mt-8 text-base font-semibold text-slate-200">Auto policy proposals</h3>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Deterministic advisory proposals from feedback, intelligence, drift, and sandbox simulation. Never activates
              automatically —{" "}
              <code className="rounded bg-slate-950/80 px-1 py-0.5 text-xs text-slate-300">
                GET /api/admin/autonomy/policy-proposals
              </code>
              .
            </p>
            <div className="mt-4">
              <PolicyProposalPanel />
            </div>
          </section>
        ) : null}

        {engineFlags.controlledExecutionV1 ? (
          <section className="mt-8">
            <RegionExecutionCapabilityNote
              note={getRegionExecutionAvailabilityNote({
                regionCode: "ca_qc",
                actionType: "CREATE_TASK",
              })}
            />
          </section>
        ) : null}

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
              <Link href="/admin/fraud" className="hover:text-emerald-300">
                Fraud & legal risk console
              </Link>
            </li>
            <li className="text-slate-500">
              GET <code className="text-slate-400">/api/admin/dashboard-intelligence</code> (set{" "}
              <code className="text-slate-400">FEATURE_MARKETPLACE_DASHBOARD_V1</code>)
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
