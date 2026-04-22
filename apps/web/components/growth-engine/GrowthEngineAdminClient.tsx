"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { GrowthEngineDashboardVm } from "@/modules/growth-engine/growth-engine.types";

const gold = "#D4AF37";

export function GrowthEngineAdminClient({ initial }: { initial: GrowthEngineDashboardVm }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function runNow() {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/growth-engine/run", { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-screen text-zinc-100" style={{ background: "#030303" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: gold }}>
              LECIPM · Autonomous growth
            </p>
            <h1 className="mt-2 font-serif text-3xl font-light text-white">Growth Engine</h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-500">
              Bounded autonomy: safe ranking boosts & notifications auto-run under SAFE_AUTOPILOT; pricing and budgets never
              apply without approval. Everything is logged.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={running}
              onClick={() => void runNow()}
              className="rounded-full px-6 py-2 text-sm font-semibold text-black disabled:opacity-50"
              style={{ background: gold }}
            >
              {running ? "Running…" : "Run cycle now"}
            </button>
            <span className="rounded-full border border-white/15 px-4 py-2 text-xs text-zinc-400">
              Mode: <strong className="text-white">{initial.autonomyMode}</strong>
            </span>
          </div>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <Stat label="Signals (scan)" value={String(initial.activeSignals.length)} hint="Latest detection pass" />
          <Stat label="Pending approvals" value={String(initial.approvalQueue.length)} hint="Marketplace autonomy queue" />
          <Stat
            label="Outcomes tracked"
            value={String(initial.performance.outcomesMeasured)}
            hint="Learning loop samples"
          />
        </section>

        {initial.lastRun ? (
          <p className="mt-6 text-xs text-zinc-600">
            Last batch <span className="font-mono text-zinc-400">{initial.lastRun.runBatchId}</span> · auto{" "}
            {initial.lastRun.autoExecuted} · queued {initial.lastRun.queuedApprovals} · skipped {initial.lastRun.skipped}
          </p>
        ) : null}

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <Panel title="Active signals" kicker="Opportunities">
            <ul className="space-y-3">
              {initial.activeSignals.slice(0, 12).map((s) => (
                <li key={s.id} className="rounded-xl border border-white/10 px-4 py-3 text-sm">
                  <span className="font-semibold text-[#D4AF37]">{s.signal}</span>
                  <span className="text-zinc-500"> · {s.entityKind}</span>
                  <p className="mt-1 text-xs text-zinc-400">{JSON.stringify(s.context).slice(0, 140)}…</p>
                </li>
              ))}
              {initial.activeSignals.length === 0 ? (
                <li className="text-sm text-zinc-500">No signals above thresholds.</li>
              ) : null}
            </ul>
          </Panel>

          <Panel title="Approval queue" kicker="Human gate">
            <ul className="space-y-3">
              {initial.approvalQueue.map((a) => (
                <li key={a.id} className="rounded-xl border border-amber-900/40 px-4 py-3 text-sm">
                  <p className="font-medium text-white">{a.actionType.replace("growth_engine:", "")}</p>
                  <p className="text-xs text-zinc-500">{a.summary}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">{a.status}</p>
                </li>
              ))}
              {initial.approvalQueue.length === 0 ? (
                <li className="text-sm text-zinc-500">Queue clear.</li>
              ) : null}
            </ul>
          </Panel>
        </div>

        <Panel title="Recent actions (audit)" kicker="Explainable">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-2">When</th>
                  <th className="py-2">Action</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Explanation</th>
                </tr>
              </thead>
              <tbody>
                {initial.recentActions.map((r) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="py-3 align-top text-xs text-zinc-500">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="py-3 align-top font-mono text-xs text-[#D4AF37]">
                      {r.actionCode}
                    </td>
                    <td className="py-3 align-top text-xs">{r.status}</td>
                    <td className="py-3 align-top text-xs text-zinc-400">{r.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Learning (effectiveness)" kicker="Rolling">
          <ul className="grid gap-3 sm:grid-cols-2">
            {initial.learningTop.map((l) => (
              <li key={`${l.signalCode}-${l.actionCode}`} className="rounded-xl border border-white/10 px-4 py-3 text-sm">
                <p className="text-white">
                  {l.signalCode} → {l.actionCode}
                </p>
                <p className="text-xs text-zinc-500">
                  attempts {l.attempts} · wins {l.positiveOutcomes} · score {l.rollingScore.toFixed(2)}
                </p>
              </li>
            ))}
            {initial.learningTop.length === 0 ? <li className="text-zinc-500">No stats yet.</li> : null}
          </ul>
        </Panel>

        <p className="mt-10 text-center text-[11px] text-zinc-600">
          Configure autonomy via <code className="text-zinc-400">GROWTH_ENGINE_AUTONOMY</code> · Cron{" "}
          <code className="text-zinc-400">POST /api/cron/growth-engine</code>
        </p>
      </div>
    </div>
  );
}

function Panel({ title, kicker, children }: { title: string; kicker: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: gold }}>
        {kicker}
      </p>
      <h2 className="font-serif text-xl text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-1 font-serif text-2xl text-white">{value}</p>
      <p className="text-xs text-zinc-600">{hint}</p>
    </div>
  );
}
