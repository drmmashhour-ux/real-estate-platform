"use client";

import { useCallback, useEffect, useState } from "react";
import type { GrowthBrainRecommendation, GrowthBrainApproval, GrowthBrainOutcomeEvent } from "@prisma/client";

type Props = {
  initialMode: string;
};

export function GrowthBrainDashboardClient({ initialMode }: Props) {
  const [loading, setLoading] = useState(true);
  const [runLoading, setRunLoading] = useState(false);
  const [recs, setRecs] = useState<GrowthBrainRecommendation[]>([]);
  const [pending, setPending] = useState<(GrowthBrainApproval & { recommendation: GrowthBrainRecommendation })[]>([]);
  const [outcomes, setOutcomes] = useState<GrowthBrainOutcomeEvent[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/growth-brain/recommendations", { cache: "no-store" });
      const data = (await res.json()) as {
        recommendations?: GrowthBrainRecommendation[];
        pendingApprovals?: (GrowthBrainApproval & { recommendation: GrowthBrainRecommendation })[];
        recentOutcomes?: GrowthBrainOutcomeEvent[];
      };
      setRecs(data.recommendations ?? []);
      setPending(data.pendingApprovals ?? []);
      setOutcomes(data.recentOutcomes ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runBrain() {
    setRunLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/growth-brain/run", { method: "POST" });
      const j = (await res.json()) as { ok?: boolean; error?: string; created?: number };
      if (!res.ok) setMsg(j.error ?? "Run failed");
      else setMsg(`Run complete — ${j.created ?? 0} recommendations upserted.`);
      await load();
    } finally {
      setRunLoading(false);
    }
  }

  async function patchRec(id: string, action: "view" | "dismiss" | "approve_queue" | "reject") {
    await fetch(`/api/admin/growth-brain/recommendations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
  }

  const top = recs.slice(0, 24);

  return (
    <div className="space-y-10">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div>
          <p className="text-xs text-slate-500">Automation mode (env)</p>
          <p className="font-mono text-sm text-amber-200">{initialMode}</p>
        </div>
        <button
          type="button"
          onClick={() => void runBrain()}
          disabled={runLoading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {runLoading ? "Running…" : "Run growth brain now"}
        </button>
      </section>
      {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}

      {loading ? <p className="text-slate-500">Loading…</p> : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Top opportunities & actions</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {top.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium text-slate-100">{r.title}</p>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  {r.domain} · {r.priority} · {(r.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{r.reasoning}</p>
              <p className="mt-2 text-slate-400">{r.suggestedAction}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300"
                  onClick={() => void patchRec(r.id, "view")}
                >
                  Mark viewed
                </button>
                <button
                  type="button"
                  className="rounded border border-amber-800/60 px-2 py-1 text-xs text-amber-200"
                  onClick={() => void patchRec(r.id, "approve_queue")}
                >
                  Queue approval
                </button>
                <button
                  type="button"
                  className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-400"
                  onClick={() => void patchRec(r.id, "dismiss")}
                >
                  Dismiss
                </button>
              </div>
            </article>
          ))}
        </div>
        {top.length === 0 && !loading ? (
          <p className="mt-4 text-sm text-slate-500">No active recommendations — run the brain or check migrations.</p>
        ) : null}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Pending approvals</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          {pending.map((p) => (
            <li key={p.id}>
              {p.recommendation.title} — {p.status}
            </li>
          ))}
          {pending.length === 0 ? <li className="text-slate-600">None.</li> : null}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Recent outcomes</h2>
        <ul className="mt-3 max-h-48 overflow-y-auto font-mono text-xs text-slate-500">
          {outcomes.map((o) => (
            <li key={o.id}>
              {o.eventType} · {o.recommendationId.slice(0, 8)}…
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
