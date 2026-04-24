"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type OverviewPayload = {
  windows: Record<string, unknown>;
  patterns: Array<{
    id: string;
    statement: string;
    confidence: number;
    domains: string[];
    suggestedAdaptation: { type: string; summary: string; expectedEffect: string };
  }>;
  proposedAdaptations: Array<{
    id: string;
    domain: string;
    adaptationType: string;
    confidenceScore: number;
    rationaleJson: unknown;
    proposedStateJson: unknown;
    createdAt: string;
  }>;
  strategyMemoryTop: Array<{
    id: string;
    domain: string;
    strategyKey: string;
    score: number;
    timesApplied: number;
    positiveOutcomes: number;
    negativeOutcomes: number;
  }>;
  strategyMemoryWeak: Array<{ id: string; domain: string; strategyKey: string; score: number }>;
  recentAdaptationEvents: Array<{
    id: string;
    status: string;
    domain: string;
    adaptationType: string;
    createdAt: string;
  }>;
};

export default function CompanyAiDashboardPage() {
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [weekly, setWeekly] = useState<unknown>(null);
  const [monthly, setMonthly] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (propose?: boolean) => {
    setError(null);
    const r = await fetch(`/api/company-ai/overview${propose ? "?propose=1" : ""}`, { credentials: "include" });
    if (!r.ok) {
      setError(await r.text());
      return;
    }
    setData((await r.json()) as OverviewPayload);
  }, []);

  useEffect(() => {
    void load(false);
    void fetch("/api/company-ai/reports/weekly", { credentials: "include" })
      .then((r) => r.json())
      .then(setWeekly)
      .catch(() => setWeekly(null));
    void fetch("/api/company-ai/reports/monthly", { credentials: "include" })
      .then((r) => r.json())
      .then(setMonthly)
      .catch(() => setMonthly(null));
  }, [load]);

  async function approve(id: string) {
    setBusy(id);
    try {
      const r = await fetch(`/api/company-ai/adaptations/${encodeURIComponent(id)}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) setError(await r.text());
      else await load(false);
    } finally {
      setBusy(null);
    }
  }

  async function reject(id: string) {
    setBusy(id);
    try {
      const r = await fetch(`/api/company-ai/adaptations/${encodeURIComponent(id)}/reject`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) setError(await r.text());
      else await load(false);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-10 text-[#f4efe4]">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-3 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/90">LECIPM · BNHub</p>
            <h1 className="font-serif text-3xl text-[#f4efe4]">Company AI</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-400">
              Adaptive company intelligence — recommendations and bounded heuristics only. No binding legal or financial
              execution. All shifts are logged; human approval gates remain authoritative.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => load(false)}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
            >
              Refresh data
            </button>
            <button
              type="button"
              onClick={() => load(true)}
              className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/20"
            >
              Propose adaptations
            </button>
            <Link
              href="/dashboard/ceo"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
            >
              CEO hub
            </Link>
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-100">{error}</div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold text-white">Company evolution summary</h2>
            <p className="mt-1 text-xs text-neutral-500">Latest persisted outcome windows (weekly / monthly / quarterly).</p>
            <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] text-emerald-100/90">
              {data ? JSON.stringify(data.windows, null, 2) : "Loading…"}
            </pre>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold text-white">Outcome windows &amp; reports</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#D4AF37]/80">Weekly reflection</p>
                <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-black/40 p-3 text-[10px] text-neutral-300">
                  {weekly ? JSON.stringify(weekly, null, 2) : "—"}
                </pre>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#D4AF37]/80">Monthly adaptation</p>
                <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-black/40 p-3 text-[10px] text-neutral-300">
                  {monthly ? JSON.stringify(monthly, null, 2) : "—"}
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Detected patterns</h2>
          <p className="mt-1 text-xs text-neutral-500">Rule-based, explainable signals from the latest monthly metrics.</p>
          <ul className="mt-4 space-y-3">
            {data?.patterns?.length ? (
              data.patterns.map((p) => (
                <li key={p.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm font-medium text-white">{p.statement}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Confidence {p.confidence.toFixed(2)} · {p.domains.join(", ")}
                  </p>
                  <p className="mt-2 text-xs text-neutral-300">
                    Suggested: {p.suggestedAdaptation.summary} — {p.suggestedAdaptation.expectedEffect}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-neutral-500">No patterns yet — run outcome aggregation (refresh).</li>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Proposed adaptations</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Approve to mark as rolled out (soft hints for ranking/portfolio systems). Reject to penalize noisy domains in
            playbook memory.
          </p>
          <ul className="mt-4 space-y-3">
            {data?.proposedAdaptations?.length ? (
              data.proposedAdaptations.map((a) => (
                <li key={a.id} className="flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-amber-100">
                      {a.adaptationType} · {a.domain}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">Confidence {a.confidenceScore.toFixed(2)}</p>
                    <pre className="mt-2 max-h-32 overflow-auto text-[10px] text-neutral-400">
                      {JSON.stringify(a.rationaleJson, null, 2)}
                    </pre>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={busy === a.id}
                      onClick={() => approve(a.id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busy === a.id}
                      onClick={() => reject(a.id)}
                      className="rounded-lg border border-rose-400/50 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-950/50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-sm text-neutral-500">No proposals in queue.</li>
            )}
          </ul>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold text-white">Strategy memory — top</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {data?.strategyMemoryTop?.map((m) => (
                <li key={m.id} className="flex justify-between gap-2 border-b border-white/5 py-2">
                  <span className="truncate text-neutral-200">
                    {m.domain}: {m.strategyKey}
                  </span>
                  <span className="shrink-0 text-[#D4AF37]">{m.score.toFixed(3)}</span>
                </li>
              )) ?? <li className="text-neutral-500">—</li>}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold text-white">Weak / avoid</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {data?.strategyMemoryWeak?.map((m) => (
                <li key={m.id} className="flex justify-between gap-2 border-b border-white/5 py-2">
                  <span className="truncate text-neutral-200">
                    {m.domain}: {m.strategyKey}
                  </span>
                  <span className="shrink-0 text-rose-300">{m.score.toFixed(3)}</span>
                </li>
              )) ?? <li className="text-neutral-500">—</li>}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Recent adaptation events (90d)</h2>
          <ul className="mt-3 divide-y divide-white/5 text-sm">
            {data?.recentAdaptationEvents?.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="text-neutral-300">
                  {e.adaptationType} · {e.domain}
                </span>
                <span className="text-xs text-neutral-500">{e.status}</span>
                <span className="text-[10px] text-neutral-600">{new Date(e.createdAt).toLocaleString()}</span>
              </li>
            )) ?? null}
          </ul>
        </section>
      </div>
    </div>
  );
}
