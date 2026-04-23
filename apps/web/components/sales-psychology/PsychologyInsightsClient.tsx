"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { closerDemoRate, loadCloserAnalytics } from "@/modules/closing";
import {
  loadPersonalityLearning,
  personalityWinRates,
} from "@/modules/personality-closing/personality-learning.service";
import { bestPerformingStrategyKeys, loadPsychologyLearning } from "@/modules/sales-psychology/psychology-learning.service";
import type { ScriptConversionStats } from "@/modules/sales-scripts/sales-script.types";

type InsightsPayload = {
  ok: boolean;
  stats?: ScriptConversionStats;
  suggestions?: { category: string; demoOrClosedRate: number; n: number }[];
};

export function PsychologyInsightsClient({ adminBase, dashBase }: { adminBase: string; dashBase: string }) {
  const [data, setData] = useState<InsightsPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/sales-scripts/insights?sinceDays=90", { method: "GET" })
      .then((r) => r.json())
      .then((j) => setData(j as InsightsPayload))
      .catch(() => setErr("Could not load call stats"));
  }, []);

  const learn = typeof window !== "undefined" ? loadPsychologyLearning() : { outcomes: {}, states: {} };
  const learnP =
    typeof window !== "undefined" ? loadPersonalityLearning() : { outcomes: {}, strategyHits: {} };
  const best = typeof window !== "undefined" ? bestPerformingStrategyKeys(8) : [];
  const persRates = typeof window !== "undefined" ? personalityWinRates(6) : [];
  const closerAgg = typeof window !== "undefined" ? loadCloserAnalytics() : null;
  const closerRate = typeof window !== "undefined" ? closerDemoRate() : 0;

  const topObjections = data?.stats?.topObjections ?? [];
  const byState = learn.states;

  return (
    <div className="mx-auto max-w-[1200px] space-y-8 p-6 text-white">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400/90">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold">Psychology insights</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Structured persuasion signals from live tools (client — not a clinical profile). Pairs with call logs and local
          learning when you mark outcomes in product flows.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-violet-300/90">
          <Link className="underline" href={`${dashBase}/admin/call-center`}>
            Call center
          </Link>
          <Link className="underline" href={`${dashBase}/admin/training-live`}>
            Live training
          </Link>
          <Link className="underline" href={`${adminBase}`}>
            Admin home
          </Link>
        </div>
      </header>

      {err ? <p className="text-sm text-amber-300">{err}</p> : null}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-6">
          <h2 className="text-sm font-semibold text-zinc-200">Top objection tags (90d calls)</h2>
          {topObjections.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">Log more calls to populate patterns.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              {topObjections.slice(0, 10).map((o) => (
                <li key={o.label} className="flex justify-between gap-4">
                  <span>{o.label}</span>
                  <span className="font-mono text-zinc-500">{o.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="text-sm font-semibold text-zinc-200">Detected tones (this browser)</h2>
          <p className="mt-2 text-xs text-zinc-500">
            Incremented when outcomes are recorded via psychology learning hooks — install `recordPsychologyOutcome` after
            demos/bookings for stronger rates.
          </p>
          {Object.keys(byState ?? {}).length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No local tone tallies yet.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              {Object.entries(byState).map(([k, v]) => (
                <li key={k} className="flex justify-between gap-4">
                  <span>{k.replace(/_/g, " ")}</span>
                  <span className="font-mono text-zinc-500">{v}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-900/35 bg-cyan-950/15 p-6">
        <h2 className="text-sm font-semibold text-cyan-200">Personality close rate (local)</h2>
        {closerAgg && closerAgg.sessions > 0 ? (
          <p className="mt-2 text-xs text-cyan-100/80">
            Ultimate closer sessions: {closerAgg.sessions} · demo/close rate from saved outcomes ~{" "}
            {(closerRate * 100).toFixed(0)}% · close-now signals {closerAgg.closeNowShown}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-zinc-500">
          From logged call assistant & live training outcomes — improves as you save sessions.
        </p>
        {persRates.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No personality outcomes yet.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {persRates.map((r) => (
              <li key={r.personality} className="flex justify-between gap-4 text-zinc-300">
                <span>{r.personality}</span>
                <span>
                  {(r.rate * 100).toFixed(0)}% · {r.tries} sessions
                </span>
              </li>
            ))}
          </ul>
        )}
        {Object.keys(learnP.strategyHits ?? {}).length > 0 ? (
          <p className="mt-4 text-[11px] text-zinc-600">
            Strategy-per-type detail stored — best combo surfaces after enough samples per personality.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-violet-900/35 bg-violet-950/20 p-6">
        <h2 className="text-sm font-semibold text-violet-200">Strategy performance (local)</h2>
        {best.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Need multiple logged outcomes per strategy.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {best.map((b) => (
              <li key={b.key} className="flex justify-between gap-4 text-zinc-300">
                <span className="font-mono text-xs text-zinc-400">{b.key}</span>
                <span>
                  {(b.rate * 100).toFixed(0)}% win rate · {b.tries} tries
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data?.suggestions && data.suggestions.length > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
          <h2 className="text-sm font-semibold text-zinc-200">Strongest script categories (heuristic)</h2>
          <ul className="mt-4 space-y-2 text-sm text-zinc-400">
            {data.suggestions.slice(0, 5).map((s) => (
              <li key={s.category}>
                {s.category.replace(/_/g, " ")} — {(s.demoOrClosedRate * 100).toFixed(0)}% · n={s.n}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
