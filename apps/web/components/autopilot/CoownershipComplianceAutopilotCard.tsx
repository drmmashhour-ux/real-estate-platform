"use client";

import { useCallback, useEffect, useState } from "react";

type Api = {
  applies: boolean;
  progressPct: number;
  certificateComplete: boolean;
  complete: boolean;
  recommendationMessage: string;
  lastAutopilot: {
    id: string;
    severity: string;
    description: string;
    createdAt: string;
  } | null;
};

export function CoownershipComplianceAutopilotCard(props: { listingId: string }) {
  const { listingId } = props;
  const [data, setData] = useState<Api | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/broker/listings/${encodeURIComponent(listingId)}/coownership-autopilot`, {
        credentials: "same-origin",
      });
      const j = (await res.json()) as Api & { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed to load");
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data?.applies) {
    return null;
  }

  return (
    <section className="rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
      <h2 className="text-sm font-semibold text-amber-950 dark:text-amber-100">Co-ownership Compliance</h2>
      <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
        LECIPM Autopilot — Québec Reg. 2025 (certificate & disclosure workflow).
      </p>

      {error ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}

      <dl className="mt-3 space-y-2 text-sm text-slate-800 dark:text-slate-200">
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-slate-600 dark:text-slate-400">Compliance progress</dt>
          <dd className="font-semibold tabular-nums">{data.progressPct}%</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-slate-600 dark:text-slate-400">Checklist status</dt>
          <dd>{data.complete ? "Complete" : "Incomplete"}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-slate-600 dark:text-slate-400">Certificate item</dt>
          <dd>{data.certificateComplete ? "Done" : "Pending"}</dd>
        </div>
      </dl>

      <p className="mt-3 rounded-lg bg-white/70 p-3 text-sm leading-relaxed text-slate-800 dark:bg-black/25 dark:text-slate-100">
        {data.recommendationMessage}
      </p>

      {data.lastAutopilot ? (
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-500">
          Last autopilot scan: {new Date(data.lastAutopilot.createdAt).toLocaleString()} · severity{" "}
          <span className="font-medium">{data.lastAutopilot.severity}</span>
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-slate-500">No autopilot audit row yet — runs on save and scheduled scans.</p>
      )}
    </section>
  );
}
