"use client";

import { useCallback, useEffect, useState } from "react";

type LeaderRow = {
  templateKey: string;
  stage: string;
  detectedIntent: string;
  detectedObjection: string;
  highIntent: boolean;
  sent: number;
  replyRate: number;
  qualifiedRate: number;
  bookedRate: number;
  staleRate: number;
  handoffRate: number;
  weightedScore: number;
};

export function AiLearningDashboardClient() {
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [reco, setReco] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [p, r] = await Promise.all([
        fetch("/api/admin/ai-learning/performance"),
        fetch("/api/admin/ai-learning/recommendations"),
      ]);
      if (!p.ok || !r.ok) {
        setErr("Failed to load learning data (admin only).");
        return;
      }
      const pj = (await p.json()) as { leaderboard: LeaderRow[] };
      const rj = (await r.json()) as Record<string, unknown>;
      setLeaderboard(pj.leaderboard ?? []);
      setReco(rj);
    } catch {
      setErr("Network error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flags = reco?.flags as { learningEnabled?: boolean; experimentsEnabled?: boolean } | undefined;
  const textRecommendations = (reco?.textRecommendations as string[] | undefined) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
        >
          Refresh
        </button>
        <span className="text-xs text-slate-500">
          AI_SELF_LEARNING_ROUTING_ENABLED: {flags?.learningEnabled ? "1" : "0 (default)"} ·
          AI_TEMPLATE_EXPERIMENTS_ENABLED: {flags?.experimentsEnabled ? "1" : "0 (default)"}
        </span>
      </div>

      {err ? <p className="text-sm text-rose-400">{err}</p> : null}

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Template leaderboard</h2>
        <div className="mt-3 max-h-[420px] overflow-auto text-xs">
          <table className="w-full border-collapse text-left text-slate-300">
            <thead>
              <tr className="border-b border-slate-700 text-slate-500">
                <th className="py-1 pr-2">template</th>
                <th className="py-1 pr-2">stage</th>
                <th className="py-1 pr-2">intent</th>
                <th className="py-1 pr-2">objection</th>
                <th className="py-1 pr-2">HI</th>
                <th className="py-1 pr-2">sent</th>
                <th className="py-1 pr-2">reply</th>
                <th className="py-1 pr-2">qual</th>
                <th className="py-1 pr-2">book</th>
                <th className="py-1 pr-2">stale</th>
                <th className="py-1 pr-2">hand</th>
                <th className="py-1">score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row) => (
                <tr key={`${row.templateKey}-${row.stage}-${row.detectedIntent}-${row.detectedObjection}-${row.highIntent}`} className="border-b border-slate-800/80">
                  <td className="py-1 pr-2 font-mono text-[10px]">{row.templateKey}</td>
                  <td className="py-1 pr-2">{row.stage || "—"}</td>
                  <td className="py-1 pr-2">{row.detectedIntent || "—"}</td>
                  <td className="py-1 pr-2">{row.detectedObjection || "—"}</td>
                  <td className="py-1 pr-2">{row.highIntent ? "Y" : ""}</td>
                  <td className="py-1 pr-2">{row.sent}</td>
                  <td className="py-1 pr-2">{(row.replyRate * 100).toFixed(0)}%</td>
                  <td className="py-1 pr-2">{(row.qualifiedRate * 100).toFixed(0)}%</td>
                  <td className="py-1 pr-2">{(row.bookedRate * 100).toFixed(0)}%</td>
                  <td className="py-1 pr-2">{(row.staleRate * 100).toFixed(0)}%</td>
                  <td className="py-1 pr-2">{(row.handoffRate * 100).toFixed(0)}%</td>
                  <td className="py-1">{row.weightedScore.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {leaderboard.length === 0 ? <p className="mt-4 text-slate-500">No performance rows yet.</p> : null}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommendations & insights</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-400">
          {textRecommendations.map((t) => (
            <li key={t}>{t}</li>
          ))}
          {textRecommendations.length === 0 ? <li>No recommendations yet — need more sent volume per context.</li> : null}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Manual override (POST API)</h2>
        <p className="mt-2 text-xs text-slate-500">
          Use <code className="text-slate-400">POST /api/admin/ai-learning/apply-recommendation</code> with JSON{" "}
          <code className="text-slate-400">
            {`{ stage, detectedIntent, detectedObjection, highIntent, overrideTemplateKey, note? }`}
          </code>
          . Overrides run after forced templates, before experiments/self-learning.
        </p>
      </section>
    </div>
  );
}
