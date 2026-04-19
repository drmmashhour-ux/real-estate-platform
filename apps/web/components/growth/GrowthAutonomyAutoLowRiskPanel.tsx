"use client";

import * as React from "react";

import type { GrowthAutonomyAutoLowRiskRolloutStage } from "@/modules/growth/growth-autonomy-auto.types";

type ExecRow = {
  id: string;
  createdAt: string;
  catalogEntryId: string;
  lowRiskActionKey: string;
  explanation: string;
  operatorVisibleResult: string;
  undoAvailable: boolean;
  reversedAt: Date | string | null;
};

export function GrowthAutonomyAutoLowRiskPanel({
  locale,
  country,
  rolloutStage,
  viewerIsAdmin,
}: {
  locale: string;
  country: string;
  rolloutStage: GrowthAutonomyAutoLowRiskRolloutStage;
  viewerIsAdmin: boolean;
}) {
  const [recent, setRecent] = React.useState<ExecRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [runMsg, setRunMsg] = React.useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch("/api/growth/autonomy/auto-execute", { credentials: "same-origin" });
      const j = (await r.json()) as { ok?: boolean; recent?: ExecRow[] };
      if (j.ok && Array.isArray(j.recent)) setRecent(j.recent);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void refresh();
  }, []);

  async function runEligible() {
    setRunMsg(null);
    try {
      const r = await fetch(
        `/api/growth/autonomy/auto-execute?locale=${encodeURIComponent(locale)}&country=${encodeURIComponent(country)}`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ maxRuns: 5 }),
        },
      );
      const j = (await r.json()) as { ok?: boolean; skipped?: boolean; reason?: string; ran?: number };
      if (!r.ok) {
        setRunMsg("Could not run auto-low-risk execution.");
        return;
      }
      if (j.skipped) setRunMsg(j.reason ?? "Skipped.");
      else setRunMsg(`Processed batch (executed rows: ${j.ran ?? 0}).`);
      await refresh();
    } catch {
      setRunMsg("Request failed.");
    }
  }

  async function undo(auditId: string) {
    try {
      await fetch("/api/growth/autonomy/auto-execute/undo", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId }),
      });
      await refresh();
    } catch {
      /* noop */
    }
  }

  return (
    <section className="mt-3 rounded-lg border border-emerald-900/40 bg-emerald-950/15 px-3 py-2.5" aria-label="Low-risk auto execution">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
          Controlled low-risk auto-actions
        </p>
        <span className="text-[10px] text-zinc-500">
          Rollout: <span className="font-mono text-zinc-400">{rolloutStage}</span>
        </span>
      </div>
      <p className="mt-1 text-[10px] leading-snug text-zinc-500">
        Only allowlisted internal records (tasks, drafts, reminders, tags, prefills). Still does{" "}
        <strong className="font-normal text-zinc-400">not</strong> auto-run payments, bookings core, ads core, CRO
        core, live pricing, external sends, or publication changes.
      </p>

      {viewerIsAdmin ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded border border-emerald-800/60 px-2 py-1 text-[10px] text-emerald-100 hover:bg-emerald-950/60"
            onClick={() => void runEligible()}
            disabled={loading}
          >
            Run eligible low-risk actions now
          </button>
          <button
            type="button"
            className="rounded border border-zinc-700 px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-900"
            onClick={() => void refresh()}
            disabled={loading}
          >
            Refresh log
          </button>
          {runMsg ? <span className="text-[10px] text-zinc-500">{runMsg}</span> : null}
        </div>
      ) : (
        <p className="mt-2 text-[10px] text-zinc-600">Admin-only trigger — execution log is still visible.</p>
      )}

      <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto text-[10px] text-zinc-400">
        {recent.length === 0 ? (
          <li className="text-zinc-600">{loading ? "Loading…" : "No low-risk auto-actions recorded yet."}</li>
        ) : (
          recent.map((row) => (
            <li key={row.id} className="rounded border border-zinc-800/80 bg-black/20 px-2 py-1">
              <span className="font-mono text-[9px] text-zinc-500">
                {new Date(row.createdAt).toISOString()}
              </span>
              <div className="text-zinc-300">{row.operatorVisibleResult}</div>
              <div className="text-[9px] text-zinc-600">{row.explanation}</div>
              {row.reversedAt ? (
                <span className="text-[9px] text-amber-400">Reversed</span>
              ) : row.undoAvailable ? (
                <button
                  type="button"
                  className="mt-1 text-[9px] text-emerald-400 underline"
                  onClick={() => void undo(row.id)}
                >
                  Undo internal record
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
