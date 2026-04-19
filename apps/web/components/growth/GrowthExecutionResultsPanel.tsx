"use client";

import * as React from "react";
import type { GrowthExecutionResultsSummary } from "@/modules/growth/growth-execution-results.types";

export function GrowthExecutionResultsPanel() {
  const [data, setData] = React.useState<GrowthExecutionResultsSummary | null | "err" | "loading">("loading");
  const [disclaimer, setDisclaimer] = React.useState("");

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      const params = new URLSearchParams({ windowDays: "14" });
      const res = await fetch(`/api/growth/execution-results/summary?${params}`, { credentials: "same-origin" });
      if (cancel) return;
      if (!res.ok) {
        setData("err");
        return;
      }
      const j = (await res.json()) as { summary: GrowthExecutionResultsSummary; disclaimer?: string };
      setData(j.summary);
      setDisclaimer(j.disclaimer ?? "");
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (data === "loading") {
    return (
      <section className="rounded-xl border border-cyan-900/40 bg-cyan-950/10 p-4" data-growth-execution-results>
        <p className="text-xs text-zinc-500">Loading execution results…</p>
      </section>
    );
  }
  if (data === "err" || !data) {
    return (
      <section className="rounded-xl border border-cyan-900/40 bg-cyan-950/10 p-4" data-growth-execution-results>
        <p className="text-sm text-amber-200/90">Execution results unavailable (enable feature + sign in to Growth Machine).</p>
      </section>
    );
  }

  const bandColor: Record<string, string> = {
    positive: "text-emerald-400",
    neutral: "text-zinc-300",
    negative: "text-rose-300",
    insufficient_data: "text-amber-200/90",
  };

  return (
    <section className="rounded-xl border border-cyan-800/40 bg-cyan-950/15 p-4" data-growth-execution-results>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-300/90">Measurement</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-100">Growth execution results (internal)</h3>
        <p className="mt-1 max-w-3xl text-[11px] text-zinc-500">
          What was logged in-panel and what changed in safe proxies — not proof of impact. {disclaimer}
        </p>
      </div>

      {data.sparseDataWarnings.length > 0 ? (
        <ul className="mt-3 list-inside list-disc text-xs text-amber-200/90">
          {data.sparseDataWarnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs font-semibold text-zinc-400">AI assist (telemetry)</p>
          <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-xs text-zinc-300">
            {data.aiAssistResults.length === 0 ? (
              <li className="text-zinc-500">No current suggestions or no in-window events.</li>
            ) : (
              data.aiAssistResults.map((r) => (
                <li key={r.suggestionId} className="border-b border-zinc-800/50 pb-2">
                  <span className="font-mono text-[10px] text-zinc-500">{r.suggestionId}</span>
                  <br />
                  <span className={bandColor[r.outcomeBand] ?? "text-zinc-300"}>{r.outcomeBand}</span> — view {r.viewed ? "y" : "n"},
                  copy {r.copied ? "y" : "n"}, ack {r.locallyApproved ? "y" : "n"}, ignore {r.ignored ? "y" : "n"}
                  <p className="mt-1 text-[10px] text-zinc-500">{r.explanation}</p>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs font-semibold text-zinc-400">Broker competition (monetization proxy)</p>
          <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-xs text-zinc-300">
            {data.brokerCompetitionResults.length === 0 ? (
              <li className="text-zinc-500">No broker competition rows.</li>
            ) : (
              data.brokerCompetitionResults.map((b) => (
                <li key={b.brokerId} className="border-b border-zinc-800/50 pb-2">
                  <span className="text-zinc-200">{b.brokerId.slice(0, 8)}…</span> · {b.tier} · score {b.score}
                  <br />
                  <span className={bandColor[b.outcomeBand] ?? "text-zinc-300"}>{b.outcomeBand}</span> — Δ
                  activity {b.leadActivityDelta ?? "—"}, close proxy {b.closeSignalDelta ?? "—"}
                  <p className="mt-1 text-[10px] text-zinc-500">{b.explanation}</p>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
          <p className="text-xs font-semibold text-zinc-400">Scale system (aggregates)</p>
          <ul className="mt-2 space-y-2 text-xs text-zinc-300">
            {data.scaleResults.map((s) => (
              <li key={s.targetType} className="border-b border-zinc-800/50 pb-2">
                <span className="font-semibold capitalize text-zinc-200">{s.targetType}</span> — current {s.currentValue} ·
                prior {s.previousValue} · δ {s.delta} · gap change {s.gapChange}
                <br />
                <span className={bandColor[s.outcomeBand] ?? "text-zinc-300"}>{s.outcomeBand}</span>
                <p className="mt-1 text-[10px] text-zinc-500">{s.explanation}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-zinc-800 bg-black/20 p-3">
        <p className="text-xs font-semibold text-zinc-400">Top insights</p>
        <ul className="mt-2 list-inside list-disc text-sm text-zinc-500">
          {data.insights.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>

      <p className="mt-2 text-[10px] text-zinc-600">
        Window {data.windowDays}d · Generated {new Date(data.generatedAt).toLocaleString()}
      </p>
    </section>
  );
}
