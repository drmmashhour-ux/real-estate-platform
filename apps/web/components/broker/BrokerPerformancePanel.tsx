"use client";

import * as React from "react";
import type {
  BrokerPerformanceEngineSnapshot,
  BrokerPerformanceSummary,
} from "@/modules/broker/performance/broker-performance.types";

function legacyBandStyle(b: string): string {
  if (b === "strong") return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
  if (b === "good") return "bg-sky-500/15 text-sky-100 border-sky-500/35";
  if (b === "watch") return "bg-amber-500/15 text-amber-100 border-amber-500/35";
  return "bg-rose-500/15 text-rose-100 border-rose-500/35";
}

function tierStyle(b: string): string {
  if (b === "elite") return "bg-violet-500/20 text-violet-100 border-violet-500/40";
  if (b === "strong") return "bg-emerald-500/20 text-emerald-200 border-emerald-500/40";
  if (b === "healthy") return "bg-sky-500/15 text-sky-100 border-sky-500/35";
  if (b === "weak") return "bg-amber-500/15 text-amber-100 border-amber-500/35";
  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
}

export function BrokerPerformancePanel({ accent = "#10b981" }: { accent?: string }) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<BrokerPerformanceSummary | null>(null);
  const [engine, setEngine] = React.useState<BrokerPerformanceEngineSnapshot | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const res = await fetch("/api/broker/performance", { credentials: "same-origin" });
        if (res.status === 404) {
          if (!cancelled) setErr("Performance scoring is not enabled.");
          return;
        }
        const data = (await res.json()) as {
          summary?: BrokerPerformanceSummary;
          engine?: BrokerPerformanceEngineSnapshot | null;
          error?: string;
        };
        if (!res.ok) {
          if (!cancelled) setErr(data.error ?? "Failed to load");
          return;
        }
        if (!cancelled) {
          setSummary(data.summary ?? null);
          setEngine(data.engine ?? null);
        }
      } catch {
        if (!cancelled) setErr("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm text-slate-400">Loading your performance snapshot…</p>
      </section>
    );
  }
  if (err || !summary) {
    return err ? (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">{err}</section>
    ) : null;
  }

  const m = engine?.metrics;
  const strength = engine?.insights.find((i) => i.type === "strength");
  const improvement =
    engine?.insights.find((i) => i.type === "weakness") ?? engine?.insights.find((i) => i.type === "data_quality");

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Your execution</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Performance snapshot</h2>
          <p className="mt-1 max-w-xl text-xs text-slate-500">
            Private coaching view — built from your CRM progression and follow-up signals. Not a guarantee of outcomes
            and not a public rank.
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums text-white">{m?.overallScore ?? summary.overallScore}</p>
          {m ? (
            <span
              className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tierStyle(m.executionBand)}`}
            >
              {m.executionBand.replace(/_/g, " ")}
            </span>
          ) : (
            <span
              className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${legacyBandStyle(summary.band)}`}
            >
              {summary.band}
            </span>
          )}
          {m ? (
            <p className="mt-1 text-[10px] text-slate-500">
              Confidence: {m.confidenceLevel}
              {m.leadsAssigned > 0 ? ` · ${m.leadsAssigned} leads in sample` : ""}
            </p>
          ) : null}
        </div>
      </div>

      {m ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {(
            [
              ["Activity", m.activityScore],
              ["Conversion", m.conversionScore],
              ["Discipline", m.disciplineScore],
            ] as const
          ).map(([label, v]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-black/25 px-2 py-2 text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
              <p className="text-lg font-semibold tabular-nums text-white" style={{ color: accent }}>
                {v}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-5">
          {(
            [
              ["Response speed", summary.breakdown.responseSpeedScore],
              ["Contact rate", summary.breakdown.contactRateScore],
              ["Engagement", summary.breakdown.engagementScore],
              ["Close signals", summary.breakdown.closeSignalScore],
              ["Retention", summary.breakdown.retentionScore],
            ] as const
          ).map(([label, v]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-black/25 px-2 py-2 text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
              <p className="text-lg font-semibold tabular-nums text-white" style={{ color: accent }}>
                {v}
              </p>
            </div>
          ))}
        </div>
      )}

      {strength || improvement ? (
        <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3 text-xs">
          {strength ? (
            <p className="text-emerald-200/90">
              <span className="font-semibold">Top strength:</span> {strength.label} — {strength.description}
            </p>
          ) : null}
          {improvement ? (
            <p className={`mt-2 ${strength ? "text-slate-400" : "text-slate-300"}`}>
              <span className="font-semibold text-slate-200">Focus next:</span> {improvement.label} —{" "}
              {improvement.suggestion ?? improvement.description}
            </p>
          ) : null}
        </div>
      ) : null}

      {engine?.incentives ? (
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-500">
          {engine.incentives.highResponseDiscipline ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">Incentive-ready: follow-up</span>
          ) : null}
          {engine.incentives.strongMeetingProgression ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">Incentive-ready: meetings</span>
          ) : null}
          {engine.incentives.steadyCloseRate ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">Incentive-ready: closes</span>
          ) : null}
        </div>
      ) : null}

      <p className="mt-4 text-[10px] text-slate-600">
        Legacy composite also available: overall {summary.overallScore} ({summary.band}). Same data — engine adds fair
        sparse-data handling.
      </p>
    </section>
  );
}
