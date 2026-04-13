"use client";

import { useState } from "react";

type Row = {
  id: string;
  style: string;
  hook: string;
  score: number;
  views: number;
  clicks?: number;
  saves?: number;
  shares?: number;
  bookings?: number;
  revenueCents?: number;
  listing: { title: string; listingCode: string; city: string | null };
};

type Props = {
  initial: {
    signals: {
      percentile: number;
      cohortSize: number;
      totalPieces: number;
      stylesRanked: { style: string; scoreSum: number; count: number }[];
      hookExamples: string[];
      worstHookExamples: string[];
      ctaBuckets: { bucket: string; scoreSum: number; count: number }[];
      visualOrderStats: { key: string; avgScore: number; count: number }[];
      cityStyleHints: { cityKey: string; topStyle: string; scoreSum: number; pieces: number }[];
    } | null;
    top: Row[];
    worst: Row[];
    rollup: { style: string; pieces: number; views: number; clicks: number; conversions: number; scoreSum: number }[];
    recommendations: string[];
  };
};

export function ContentIntelligenceClient({ initial }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refreshScores() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/content-intelligence/refresh-scores", { method: "POST" });
      const data = (await res.json()) as { updated?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg(`Recomputed scores for ${data.updated ?? 0} rows. Refresh the page.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void refreshScores()}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
        >
          {busy ? "Working…" : "Refresh performance scores"}
        </button>
        {msg ? <span className="text-sm text-zinc-400">{msg}</span> : null}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Recommendations</h2>
        <ul className="list-inside list-disc space-y-2 text-sm text-zinc-300">
          {initial.recommendations.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </section>

      {initial.signals ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
            <h3 className="text-sm font-semibold text-amber-200/90">Winning styles (top cohort)</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Top ~{(initial.signals.percentile * 100).toFixed(0)}% · {initial.signals.cohortSize} pieces ·{" "}
              {initial.signals.totalPieces} total
            </p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              {initial.signals.stylesRanked.map((s) => (
                <li key={s.style} className="flex justify-between gap-2 border-b border-zinc-800/80 py-1">
                  <span className="font-mono text-xs text-emerald-300/90">{s.style}</span>
                  <span className="text-zinc-500">
                    score {s.scoreSum.toFixed(1)} · {s.count} pcs
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
            <h3 className="text-sm font-semibold text-amber-200/90">CTA patterns (cohort)</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              {initial.signals.ctaBuckets.slice(0, 8).map((c) => (
                <li key={c.bucket} className="flex justify-between gap-2">
                  <span className="font-mono text-xs">{c.bucket}</span>
                  <span className="text-zinc-500">
                    {c.scoreSum.toFixed(1)} · n={c.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
            <h3 className="text-sm font-semibold text-amber-200/90">Visual order hints</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              {initial.signals.visualOrderStats.map((v) => (
                <li key={v.key} className="flex justify-between gap-2">
                  <span>{v.key}</span>
                  <span className="text-zinc-500">
                    avg {v.avgScore.toFixed(2)} · n={v.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
            <h3 className="text-sm font-semibold text-amber-200/90">City → style (cohort)</h3>
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-sm text-zinc-300">
              {initial.signals.cityStyleHints.map((c) => (
                <li key={c.cityKey} className="flex justify-between gap-2 border-b border-zinc-800/60 py-1">
                  <span className="text-zinc-400">{c.cityKey.replace(/_/g, " ")}</span>
                  <span className="font-mono text-xs text-sky-300/90">
                    {c.topStyle} · {c.pieces} pcs
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <p className="text-sm text-zinc-500">Not enough pieces yet for cohort analysis (need ≥5).</p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Hooks to learn from</h2>
        {initial.signals ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-emerald-600/90">Winning examples</p>
              <ul className="mt-2 space-y-2 text-xs text-zinc-400">
                {initial.signals.hookExamples.slice(0, 8).map((h, i) => (
                  <li key={i} className="rounded border border-zinc-800 bg-zinc-900/40 p-2">
                    {h}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase text-red-600/90">Weak examples (bottom cohort)</p>
              <ul className="mt-2 space-y-2 text-xs text-zinc-500">
                {initial.signals.worstHookExamples.slice(0, 6).map((h, i) => (
                  <li key={i} className="rounded border border-zinc-800/80 p-2">
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">Cohort analysis unavailable.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Style rollup (all time)</h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Style</th>
                <th className="px-3 py-2">Pieces</th>
                <th className="px-3 py-2">Views</th>
                <th className="px-3 py-2">Score Σ</th>
              </tr>
            </thead>
            <tbody>
              {initial.rollup.map((r) => (
                <tr key={r.style} className="border-b border-zinc-800/80">
                  <td className="px-3 py-2 font-mono text-xs text-amber-200/80">{r.style}</td>
                  <td className="px-3 py-2 text-zinc-400">{r.pieces}</td>
                  <td className="px-3 py-2 text-zinc-400">{r.views}</td>
                  <td className="px-3 py-2 text-zinc-400">{r.scoreSum.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-600/90">Top content</h2>
          <ul className="space-y-2 text-sm">
            {initial.top.map((r) => (
              <li key={r.id} className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2">
                <p className="font-mono text-xs text-emerald-300/90">{r.style}</p>
                <p className="text-zinc-300">{r.hook}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  score {r.score.toFixed(2)} · {r.views} views · {r.listing.city ?? "—"} · {r.listing.listingCode}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-red-600/90">Worst content</h2>
          <ul className="space-y-2 text-sm">
            {initial.worst.map((r) => (
              <li key={r.id} className="rounded-lg border border-red-900/30 bg-red-950/10 px-3 py-2">
                <p className="font-mono text-xs text-red-300/80">{r.style}</p>
                <p className="text-zinc-400">{r.hook}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  score {r.score.toFixed(2)} · {r.views} views · {r.listing.listingCode}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
