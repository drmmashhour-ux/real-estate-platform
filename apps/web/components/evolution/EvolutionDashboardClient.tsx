"use client";

import { useCallback, useEffect, useState } from "react";

type Snapshot = {
  engineVersion: string;
  windowDays: number;
  outcomeEventsLast30d: number;
  improvementHint: string;
  recentOutcomes: Array<{
    id: string;
    domain: string;
    metricType: string;
    strategyKey: string | null;
    experimentKey: string | null;
    varianceScore: number | null;
    createdAt: string;
  }>;
  strategyMemory: Array<{
    id: string;
    domain: string;
    strategyKey: string;
    reinforcementScore: number;
    successCount: number;
    failureCount: number;
    updatedAt: string;
  }>;
  experiments: Array<{
    id: string;
    experimentKey: string;
    name: string;
    domain: string;
    status: string;
    trafficCapPercent: number;
    requiresHumanApproval: boolean;
    approvedAt: string | null;
    updatedAt: string;
  }>;
  pendingAdjustments: Array<{
    id: string;
    domain: string;
    kind: string;
    status: string;
    rationale: string | null;
    createdAt: string;
  }>;
  monitoring?: Record<string, unknown>;
};

export function EvolutionDashboardClient({ isAdmin }: { isAdmin: boolean }) {
  const [data, setData] = useState<Snapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const q = isAdmin ? "?monitoring=1" : "";
      const res = await fetch(`/api/evolution/dashboard${q}`, { credentials: "same-origin" });
      const j = (await res.json()) as Snapshot & { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
      setData(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  async function approveAdjustment(id: string) {
    const res = await fetch(`/api/evolution/adjustment/${encodeURIComponent(id)}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setErr(j.error ?? "Approve failed");
      return;
    }
    await load();
  }

  async function rejectAdjustment(id: string) {
    const res = await fetch(`/api/evolution/adjustment/${encodeURIComponent(id)}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setErr(j.error ?? "Reject failed");
      return;
    }
    await load();
  }

  async function approveExperiment(id: string) {
    const res = await fetch(`/api/evolution/experiment/${encodeURIComponent(id)}/approve`, {
      method: "POST",
      credentials: "same-origin",
    });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setErr(j.error ?? "Approve failed");
      return;
    }
    await load();
  }

  if (loading && !data) return <p className="text-sm text-slate-500">Loading evolution loop…</p>;

  return (
    <div className="space-y-8 text-slate-100">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400/90">Evolution</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Self-evolving loop</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Outcomes → feedback → bounded reinforcement → human-approved policy tweaks. No silent production automation — experiments and
          weight changes require explicit approval.
        </p>
      </header>

      {err ? <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{err}</p> : null}

      {data ?
        <>
          <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
            <h2 className="text-lg font-semibold text-white">Signal summary</h2>
            <p className="mt-2 text-sm text-slate-400">{data.improvementHint}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-slate-500">Engine</dt>
                <dd className="font-medium">{data.engineVersion}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Outcomes ({data.windowDays}d)</dt>
                <dd className="font-medium">{data.outcomeEventsLast30d}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Pending proposals</dt>
                <dd className="font-medium">{data.pendingAdjustments.length}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
            <h2 className="text-lg font-semibold text-white">Safe experiments</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Key</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Traffic cap</th>
                    <th className="py-2 pr-4">Approval</th>
                    {isAdmin ?
                      <th className="py-2">Actions</th>
                    : null}
                  </tr>
                </thead>
                <tbody>
                  {data.experiments.map((e) => (
                    <tr key={e.id} className="border-t border-white/10">
                      <td className="py-2 pr-4 font-medium text-white">{e.experimentKey}</td>
                      <td className="py-2 pr-4">{e.status}</td>
                      <td className="py-2 pr-4">{e.trafficCapPercent}%</td>
                      <td className="py-2 pr-4">{e.requiresHumanApproval ? "required" : "optional"}</td>
                      {isAdmin ?
                        <td className="py-2">
                          {e.status === "DRAFT" ?
                            <button
                              type="button"
                              className="rounded-md bg-emerald-600/70 px-2 py-1 text-[11px] text-white hover:bg-emerald-600"
                              onClick={() => void approveExperiment(e.id)}
                            >
                              Approve (admin)
                            </button>
                          : null}
                        </td>
                      : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
            <h2 className="text-lg font-semibold text-white">Strategy memory (reinforcement)</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Strategy</th>
                    <th className="py-2 pr-4">Domain</th>
                    <th className="py-2 pr-4">Score</th>
                    <th className="py-2 pr-4">W/L</th>
                  </tr>
                </thead>
                <tbody>
                  {data.strategyMemory.map((s) => (
                    <tr key={s.id} className="border-t border-white/10">
                      <td className="py-2 pr-4 text-white">{s.strategyKey}</td>
                      <td className="py-2 pr-4">{s.domain}</td>
                      <td className="py-2 pr-4">{s.reinforcementScore.toFixed(3)}</td>
                      <td className="py-2 pr-4">
                        {s.successCount}/{s.failureCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
            <h2 className="text-lg font-semibold text-white">Recent outcomes</h2>
            <ul className="mt-4 space-y-2 text-xs text-slate-300">
              {data.recentOutcomes.map((o) => (
                <li key={o.id} className="rounded-lg bg-white/5 px-3 py-2">
                  <span className="text-slate-500">{new Date(o.createdAt).toISOString().slice(0, 16)}</span> · {o.metricType} ·{" "}
                  {o.strategyKey ?? "—"} · variance {o.varianceScore ?? "—"}
                </li>
              ))}
            </ul>
          </section>

          {isAdmin && data.pendingAdjustments.length > 0 ?
            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
              <h2 className="text-lg font-semibold text-amber-100">Pending policy adjustments</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {data.pendingAdjustments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/40 px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{p.kind}</p>
                      <p className="text-xs text-slate-400">{p.rationale ?? "No rationale"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md bg-emerald-600/70 px-3 py-1 text-xs text-white"
                        onClick={() => void approveAdjustment(p.id)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-white/10 px-3 py-1 text-xs text-slate-200"
                        onClick={() => void rejectAdjustment(p.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          : null}

          {isAdmin && data.monitoring ?
            <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
              <h2 className="text-lg font-semibold text-white">Monitoring (admin)</h2>
              <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-black/50 p-4 text-[11px] text-slate-400">
                {JSON.stringify(data.monitoring, null, 2)}
              </pre>
            </section>
          : null}
        </>
      : null}

      <button
        type="button"
        onClick={() => void load()}
        className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
      >
        Refresh
      </button>
    </div>
  );
}
