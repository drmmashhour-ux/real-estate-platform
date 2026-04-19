"use client";

import * as React from "react";
import type { FastDealSummary } from "@/modules/growth/fast-deal-results.types";

export function FastDealResultsPanel() {
  const [summary, setSummary] = React.useState<FastDealSummary | null | "err" | "loading">("loading");
  const [disclaimer, setDisclaimer] = React.useState("");

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      const res = await fetch("/api/admin/growth/fast-deal/summary", { credentials: "same-origin" });
      if (cancel) return;
      if (!res.ok) {
        setSummary("err");
        return;
      }
      const j = (await res.json()) as { summary: FastDealSummary | null; disclaimer?: string };
      setSummary(j.summary);
      setDisclaimer(j.disclaimer ?? "");
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (summary === "loading") {
    return (
      <section
        className="rounded-xl border border-fuchsia-900/40 bg-fuchsia-950/10 p-4"
        data-growth-fast-deal-results
      >
        <p className="text-xs text-zinc-500">Loading Fast Deal results…</p>
      </section>
    );
  }
  if (summary === "err" || !summary) {
    return (
      <section
        className="rounded-xl border border-fuchsia-900/40 bg-fuchsia-950/10 p-4"
        data-growth-fast-deal-results
      >
        <p className="text-sm text-amber-200/90">Could not load Fast Deal results (check admin + feature flag).</p>
      </section>
    );
  }

  return (
    <section
      className="rounded-xl border border-fuchsia-800/50 bg-fuchsia-950/20 p-4"
      data-growth-fast-deal-results
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-fuchsia-300/90">Fast Deal</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-100">Results loop</h3>
        <p className="mt-1 max-w-3xl text-[11px] text-zinc-500">
          Internal measurement — sourcing usage, landing captures, playbook checkpoints, and manually tagged outcomes.
          {disclaimer ? ` ${disclaimer}` : ""}
        </p>
      </div>

      <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-950/20 px-3 py-2 text-[11px] text-amber-100/90">
        Sparse-data: <span className="capitalize">{summary.sparse.level}</span> — {summary.sparse.message}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs font-semibold text-fuchsia-200/90">Broker sourcing (by platform)</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            {summary.sourcingUsage.length === 0 ? (
              <li className="text-zinc-500">No logged events.</li>
            ) : (
              summary.sourcingUsage.map((r) => (
                <li key={r.platform}>
                  <span className="font-medium text-white">{r.platform}</span>: {r.events} events · {r.queryCopies}{" "}
                  query copies · {r.sessionsStarted} sessions started
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs font-semibold text-fuchsia-200/90">Landing preview (market label)</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            {summary.landingPerformance.length === 0 ? (
              <li className="text-zinc-500">No landing capture events.</li>
            ) : (
              summary.landingPerformance.map((r) => (
                <li key={r.marketVariant}>
                  <span className="font-medium text-white">{r.marketVariant}</span>: {r.previewShown} previews ·{" "}
                  {r.formStarted} form starts · {r.submitted} submits
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs font-semibold text-fuchsia-200/90">48h playbook</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            {summary.playbookProgress.length === 0 ? (
              <li className="text-zinc-500">No playbook checkpoints logged.</li>
            ) : (
              summary.playbookProgress.map((r) => (
                <li key={r.step}>
                  Step {r.step}: {r.acknowledged} ack · {r.completed} done
                  {r.possiblySkippedHints > 0 ? (
                    <span className="text-zinc-500"> · skip hint +{r.possiblySkippedHints}</span>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs font-semibold text-fuchsia-200/90">Tagged outcomes</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            {summary.outcomes.length === 0 ? (
              <li className="text-zinc-500">No outcome rows yet (use log API or CRM follow-up tags manually).</li>
            ) : (
              summary.outcomes.map((o) => (
                <li key={o.outcomeType}>
                  {o.outcomeType}: <span className="tabular-nums text-white">{o.count}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-zinc-800 bg-black/30 p-3">
        <p className="text-xs font-semibold text-zinc-400">Insights</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
          {summary.insights.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-[10px] text-zinc-600">
        Generated {new Date(summary.generatedAt).toLocaleString()}
      </p>
    </section>
  );
}
