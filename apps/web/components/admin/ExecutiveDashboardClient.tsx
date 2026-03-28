"use client";

import { useCallback, useEffect, useState } from "react";

type SnapshotRow = {
  id: string;
  snapshotType: string;
  snapshotDate: string;
  metricsJson: unknown;
};

type ScoreRow = {
  entityType: string;
  entityId: string;
  scoreType: string;
  scoreValue: number;
};

type RecRow = {
  id: string;
  recommendationType: string;
  priorityScore: number;
  status: string;
  title: string;
  summary: string;
  safeAutoActionKey: string | null;
  targetEntityType: string | null;
  targetEntityId: string | null;
};

function pickMessaging(m: Record<string, unknown> | null | undefined) {
  if (!m || typeof m !== "object") return null;
  const mc = m.messagingAndConversion as Record<string, unknown> | undefined;
  return mc ?? null;
}

export function ExecutiveDashboardClient() {
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [recs, setRecs] = useState<RecRow[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [kRes, sRes, rRes] = await Promise.all([
        fetch("/api/admin/executive/kpis?limit=30"),
        fetch("/api/admin/executive/scores?take=80"),
        fetch("/api/admin/executive/recommendations?take=50"),
      ]);
      const k = await kRes.json();
      const s = await sRes.json();
      const r = await rRes.json();
      if (k.warning) setWarn(k.warning);
      else if (s.warning) setWarn(s.warning);
      else if (r.warning) setWarn(r.warning);
      else setWarn(null);
      setSnapshots(k.snapshots ?? []);
      setScores(s.scores ?? []);
      setRecs(r.recommendations ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const latestDaily = snapshots.find((x) => x.snapshotType === "daily") ?? snapshots[0];
  const mc = latestDaily
    ? pickMessaging(latestDaily.metricsJson as Record<string, unknown>)
    : null;

  const replyRate = typeof mc?.replyRate === "number" ? mc.replyRate : null;
  const bookedRate = typeof mc?.bookedRate === "number" ? mc.bookedRate : null;
  const staleRate = typeof mc?.staleRate === "number" ? mc.staleRate : null;
  const hiConv = typeof mc?.highIntentConversionRate === "number" ? mc.highIntentConversionRate : null;

  const pipeline = latestDaily
    ? ((latestDaily.metricsJson as Record<string, unknown>)?.pipelineAndOrchestration as Record<
        string,
        unknown
      >) ?? null
    : null;
  const brokerSla = latestDaily
    ? ((latestDaily.metricsJson as Record<string, unknown>)?.brokerHostPerformance as Record<
        string,
        unknown
      >) ?? null
    : null;
  const bookingSig = latestDaily
    ? ((latestDaily.metricsJson as Record<string, unknown>)?.revenueAndBookingSignals as Record<
        string,
        unknown
      >) ?? null
    : null;

  async function dismiss(id: string) {
    await fetch(`/api/admin/executive/recommendations/${id}/dismiss`, { method: "POST" });
    void load();
  }

  async function apply(id: string) {
    await fetch(`/api/admin/executive/recommendations/${id}/apply`, { method: "POST" });
    void load();
  }

  const cityScores = scores.filter((x) => x.entityType === "city" && x.scoreType === "priority");
  const templateScores = scores.filter((x) => x.entityType === "template" && x.scoreType === "quality");

  return (
    <div className="space-y-10">
      {warn ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{warn}</p>
      ) : null}
      {loading ? <p className="text-sm text-slate-500">Loading executive data…</p> : null}

      <section>
        <h2 className="text-lg font-semibold text-white">Executive KPI cards</h2>
        <p className="mt-1 text-xs text-slate-500">Sourced from latest snapshot metrics (growth AI + orchestration signals).</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Reply rate", v: replyRate != null ? `${(replyRate * 100).toFixed(1)}%` : "—" },
            { label: "Booked rate", v: bookedRate != null ? `${(bookedRate * 100).toFixed(1)}%` : "—" },
            { label: "Stale rate", v: staleRate != null ? `${(staleRate * 100).toFixed(1)}%` : "—" },
            { label: "HI → booked", v: hiConv != null ? `${(hiConv * 100).toFixed(1)}%` : "—" },
            {
              label: "Broker SLA hit",
              v: typeof brokerSla?.brokerResponseSlaHitRate === "number"
                ? `${((brokerSla.brokerResponseSlaHitRate as number) * 100).toFixed(0)}%`
                : "—",
            },
            {
              label: "Host SLA hit",
              v: typeof brokerSla?.hostResponseSlaHitRate === "number"
                ? `${((brokerSla.hostResponseSlaHitRate as number) * 100).toFixed(0)}%`
                : "—",
            },
            {
              label: "Booking recovery (assist)",
              v:
                typeof bookingSig?.bookingRecoveryAfterAssistRate === "number"
                  ? `${((bookingSig.bookingRecoveryAfterAssistRate as number) * 100).toFixed(0)}%`
                  : "—",
            },
            {
              label: "Overdue assignments",
              v: pipeline?.overdueAssignmentCount != null ? String(pipeline.overdueAssignmentCount) : "—",
            },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">{c.label}</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">{c.v}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Trends (snapshots)</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/80">
                <th className="px-3 py-2 text-left text-slate-400">Type</th>
                <th className="px-3 py-2 text-left text-slate-400">Date</th>
                <th className="px-3 py-2 text-right text-slate-400">Conversations</th>
                <th className="px-3 py-2 text-right text-slate-400">Booked rate</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.slice(0, 14).map((s) => {
                const mj = s.metricsJson as Record<string, unknown> | undefined;
                const m = mj?.messagingAndConversion as Record<string, unknown> | undefined;
                return (
                  <tr key={s.id} className="border-b border-slate-800/80">
                    <td className="px-3 py-2 text-slate-300">{s.snapshotType}</td>
                    <td className="px-3 py-2 text-slate-400">{s.snapshotDate.slice(0, 10)}</td>
                    <td className="px-3 py-2 text-right text-slate-300">
                      {typeof m?.totalConversations === "number" ? m.totalConversations : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-300">
                      {typeof m?.bookedRate === "number" ? `${((m.bookedRate as number) * 100).toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Leaderboards</h2>
          <p className="mt-1 text-xs text-slate-500">Cities and templates by executive score.</p>
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-800 p-3">
            <p className="text-xs font-semibold text-slate-400">Top cities</p>
            {cityScores.slice(0, 8).map((c) => (
              <div key={`${c.entityType}-${c.entityId}`} className="flex justify-between text-sm text-slate-300">
                <span className="truncate">{c.entityId}</span>
                <span className="text-emerald-400">{c.scoreValue.toFixed(2)}</span>
              </div>
            ))}
            {cityScores.length === 0 ? <p className="text-sm text-slate-500">No city scores yet.</p> : null}
          </div>
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-800 p-3">
            <p className="text-xs font-semibold text-slate-400">Template quality</p>
            {templateScores.slice(0, 8).map((c) => (
              <div key={c.entityId} className="flex justify-between text-xs text-slate-300">
                <span className="truncate font-mono">{c.entityId.slice(0, 48)}</span>
                <span className="text-emerald-400">{c.scoreValue.toFixed(2)}</span>
              </div>
            ))}
            {templateScores.length === 0 ? <p className="text-sm text-slate-500">No template scores yet.</p> : null}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">Recommendations</h2>
          <p className="mt-1 text-xs text-slate-500">Open items from the last executive cycle. Apply runs safe actions (admin override).</p>
          <div className="mt-3 space-y-3">
            {recs
              .filter((r) => r.status === "open")
              .map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{r.recommendationType}</span>
                    <span className="text-xs text-amber-400/90">P{r.priorityScore}</span>
                  </div>
                  <p className="mt-2 font-medium text-white">{r.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{r.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.safeAutoActionKey ? (
                      <button
                        type="button"
                        onClick={() => void apply(r.id)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        Apply safe action
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void dismiss(r.id)}
                      className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            {recs.filter((r) => r.status === "open").length === 0 ? (
              <p className="text-sm text-slate-500">No open recommendations. Enable AI_EXECUTIVE_CONTROL_ENABLED and run cron.</p>
            ) : null}
          </div>
        </div>
      </section>

      <p className="text-xs text-slate-600">
        Env: <code className="text-slate-400">AI_EXECUTIVE_CONTROL_ENABLED</code>,{" "}
        <code className="text-slate-400">AI_EXECUTIVE_AUTO_ACTIONS_ENABLED</code>. No refunds, disputes, or legal
        automation — recommendations and limited assignment-rule tweaks only.
      </p>
    </div>
  );
}
