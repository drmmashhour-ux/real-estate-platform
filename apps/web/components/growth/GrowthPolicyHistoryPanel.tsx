"use client";

import * as React from "react";

import type {
  GrowthPolicyHistoryEntry,
  GrowthPolicyHistorySummary,
} from "@/modules/growth/policy/growth-policy-history.types";

import { GrowthPolicyReviewPanel } from "./GrowthPolicyReviewPanel";

export type GrowthPolicyHistoryPanelProps = {
  /** FEATURE_GROWTH_POLICY_REVIEW_V1 — nested review form. */
  reviewUiEnabled?: boolean;
};

export function GrowthPolicyHistoryPanel({ reviewUiEnabled = false }: GrowthPolicyHistoryPanelProps) {
  const [entries, setEntries] = React.useState<GrowthPolicyHistoryEntry[]>([]);
  const [summary, setSummary] = React.useState<GrowthPolicyHistorySummary | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<GrowthPolicyHistoryEntry | null>(null);

  const load = React.useCallback(() => {
    void fetch("/api/growth/policy/history", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as {
          entries?: GrowthPolicyHistoryEntry[];
          summary?: GrowthPolicyHistorySummary;
          error?: string;
        };
        if (!r.ok) throw new Error(j.error ?? "Failed");
        return j;
      })
      .then((j) => {
        setEntries(j.entries ?? []);
        setSummary(j.summary ?? null);
        setErr(null);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-black/40 p-4 text-sm text-zinc-500">
        Loading policy history…
      </div>
    );
  }
  if (err) {
    return (
      <div className="rounded-xl border border-red-900/45 bg-red-950/25 p-4 text-sm text-red-200">
        Policy history: {err}
      </div>
    );
  }

  const top = summary?.topRecurringFindings ?? [];

  return (
    <section className="rounded-xl border border-zinc-800 bg-black/55 p-4" data-growth-policy-history-v1>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold tracking-tight text-zinc-100">Policy history</p>
          <p className="mt-0.5 max-w-xl text-[10px] text-zinc-500">
            Fingerprints dedupe recurring signals. Reviews are explicit human entries — they do not auto-resolve findings or imply
            causation; live policy output stays primary.
          </p>
        </div>
        {summary ? (
          <div className="flex flex-wrap gap-3 text-[10px] text-zinc-500">
            <span>
              Rows <strong className="text-zinc-300">{summary.totalHistoricalFindings}</strong>
            </span>
            <span>
              Recurring <strong className="text-amber-300">{summary.activeRecurringCount}</strong>
            </span>
            <span>
              Resolved (absent) <strong className="text-emerald-300">{summary.resolvedReviewedCount}</strong>
            </span>
          </div>
        ) : null}
      </div>

      {top.length > 0 ? (
        <div className="mt-3 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200/80">
            Top recurring
          </p>
          <ul className="flex flex-wrap gap-2">
            {top.slice(0, 5).map((e) => (
              <li
                key={e.fingerprint}
                className="rounded border border-amber-900/40 bg-amber-950/20 px-2 py-1 text-[10px] text-amber-100"
              >
                <span className="font-medium">{e.domain}</span> · {e.seenCount}× · {e.title.slice(0, 42)}
                {e.title.length > 42 ? "…" : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-zinc-800 text-[9px] uppercase tracking-wide text-zinc-500">
              <th className="py-2 pr-2">Domain</th>
              <th className="py-2 pr-2">Title</th>
              <th className="py-2 pr-2">Severity</th>
              <th className="py-2 pr-2">Seen</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 pr-2">Last reviewed</th>
              <th className="py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.fingerprint} className="border-b border-zinc-900/80">
                <td className="py-2 pr-2 align-top text-zinc-400">{e.domain}</td>
                <td className="py-2 pr-2 align-top text-zinc-200">{e.title}</td>
                <td className="py-2 pr-2 align-top text-zinc-400">{e.severity}</td>
                <td className="py-2 pr-2 align-top text-zinc-400">{e.seenCount}</td>
                <td className="py-2 pr-2 align-top">
                  <span
                    className={
                      e.currentStatus === "recurring"
                        ? "text-amber-300"
                        : e.currentStatus === "resolved_reviewed"
                          ? "text-emerald-300"
                          : "text-zinc-400"
                    }
                  >
                    {e.currentStatus}
                  </span>
                </td>
                <td className="py-2 pr-2 align-top text-zinc-500">
                  {e.lastReviewedAt ? e.lastReviewedAt.slice(0, 10) : "—"}
                </td>
                <td className="py-2 align-top">
                  <button
                    type="button"
                    className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-800"
                    onClick={() => setSelected(e)}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 ? <p className="mt-3 text-[11px] text-zinc-500">No history rows yet.</p> : null}
      </div>

      {reviewUiEnabled ? (
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <GrowthPolicyReviewPanel entry={selected} onSaved={load} />
        </div>
      ) : null}
    </section>
  );
}
