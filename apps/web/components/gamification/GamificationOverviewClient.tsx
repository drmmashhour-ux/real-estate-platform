"use client";

import { useCallback, useEffect, useState } from "react";

type Me = {
  totalPoints: number;
  effectivePoints: number;
  complianceQuality: number;
  level: string;
  streaks: { type: string; count: number }[];
  badgesEarned: number;
  badgesLockedHints: string[];
  rewardsAvailable: number;
  leaderboardPreview: Array<{
    rank: number;
    displayName: string | null;
    normalizedScore: number;
    level: string;
  }>;
  myRankGlobal?: number | null;
};

export function GamificationOverviewClient() {
  const [data, setData] = useState<Me | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/gamification/me", { credentials: "same-origin" });
      const j = await res.json();
      if (!j.ok) setErr(j.error ?? "load_failed");
      else setData(j as Me);
    } catch {
      setErr("load_failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function recompute() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/gamification/recompute", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const j = await res.json();
      if (!j.ok) setErr(j.error ?? "recompute_failed");
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (err) return <p className="text-sm text-rose-400">{err}</p>;
  if (!data) return <p className="text-sm text-slate-500">Loading gamification profile…</p>;

  const activeStreak =
    data.streaks.find((s) => s.type === "ACTIVE_DAYS")?.count ?? data.streaks[0]?.count ?? 0;

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">My score</h2>
            <p className="mt-2 text-sm text-slate-400">
              Levels gate on compliance — noisy volume alone does not rank you up.
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void recompute()}
            className="rounded-lg border border-violet-400/40 px-4 py-2 text-xs font-semibold text-violet-100 hover:bg-violet-950/50 disabled:opacity-40"
          >
            Refresh score
          </button>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-black/30 p-4">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">Total points</dt>
            <dd className="mt-1 text-2xl font-bold text-white">{data.totalPoints}</dd>
          </div>
          <div className="rounded-xl bg-black/30 p-4">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">Effective (quality-weighted)</dt>
            <dd className="mt-1 text-2xl font-bold text-violet-200">{data.effectivePoints}</dd>
          </div>
          <div className="rounded-xl bg-black/30 p-4">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">Level</dt>
            <dd className="mt-1 text-xl font-semibold text-white">{data.level}</dd>
          </div>
          <div className="rounded-xl bg-black/30 p-4">
            <dt className="text-[10px] uppercase tracking-wide text-slate-500">Active streak</dt>
            <dd className="mt-1 text-2xl font-bold text-emerald-300">{activeStreak} days</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-slate-500">
          Compliance signal: {(data.complianceQuality * 100).toFixed(0)}% · Monthly rank (# global):{" "}
          <strong className="text-slate-300">{data.myRankGlobal ?? "—"}</strong>
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 p-6">
        <h3 className="text-sm font-semibold text-white">Badges · {data.badgesEarned} earned</h3>
        <ul className="mt-4 space-y-2 text-xs text-slate-400">
          {data.badgesLockedHints.slice(0, 5).map((h, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-slate-600">◇</span>
              {h}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">Rewards</h3>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-200">
            {data.rewardsAvailable} available
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Featured placement redemption requires elite compliance + trust thresholds.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 p-6">
        <h3 className="text-sm font-semibold text-white">Leaderboard preview (monthly · global)</h3>
        <ul className="mt-4 divide-y divide-white/5">
          {data.leaderboardPreview.map((r) => (
            <li key={r.rank} className="flex justify-between gap-4 py-2 text-xs">
              <span className="text-slate-300">
                #{r.rank} · {r.displayName ?? "Broker"}
              </span>
              <span className="text-slate-500">
                {r.normalizedScore.toFixed(1)} pts · {r.level}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
