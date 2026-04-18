"use client";

import * as React from "react";
import type { GrowthCadenceBundle } from "@/modules/growth/growth-cadence.types";

function badgeClass(s: string): string {
  if (s === "strong") return "border-emerald-500/50 bg-emerald-950/40 text-emerald-200";
  if (s === "healthy") return "border-sky-500/40 bg-sky-950/30 text-sky-100";
  if (s === "watch") return "border-amber-500/40 bg-amber-950/35 text-amber-100";
  return "border-rose-500/40 bg-rose-950/30 text-rose-100";
}

export function GrowthCadencePanel() {
  const [bundle, setBundle] = React.useState<GrowthCadenceBundle | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/cadence", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { error?: string; bundle?: GrowthCadenceBundle };
        if (!r.ok) throw new Error(j.error ?? "Cadence unavailable");
        return j.bundle ?? null;
      })
      .then((b) => {
        if (!cancelled) {
          setBundle(b);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setErr(e.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading operating cadence…</p>;
  }
  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!bundle) {
    return null;
  }

  const { daily, weekly } = bundle;

  return (
    <div className="rounded-xl border border-cyan-900/35 bg-cyan-950/15 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-cyan-100">
          <span aria-hidden>🧩</span> Growth Operating Cadence
        </h3>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${badgeClass(daily.status)}`}
        >
          {daily.status}
        </span>
      </div>
      <p className="mt-1 text-xs text-zinc-500">Advisory rhythm only — no auto-execution.</p>

      <div className="mt-4 space-y-2 border-t border-zinc-800/80 pt-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Daily</h4>
        {daily.focus ? (
          <p className="text-sm text-zinc-200">
            <span className="text-zinc-500" aria-hidden>
              🎯{" "}
            </span>
            {daily.focus}
          </p>
        ) : null}
        <ul className="space-y-1.5 text-sm text-zinc-300">
          {daily.checklist.slice(0, 5).map((c) => (
            <li key={c.id} className="flex flex-wrap gap-2">
              <span className="text-zinc-500">{c.priority}</span>
              <span>{c.title}</span>
              <span className="text-[10px] uppercase text-zinc-600">({c.source})</span>
            </li>
          ))}
        </ul>
        {daily.risks.length > 0 ? (
          <div>
            <p className="text-[11px] font-medium text-amber-200/90">Risks</p>
            <ul className="mt-1 list-inside list-disc text-xs text-amber-100/80">
              {daily.risks.slice(0, 5).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-2 border-t border-zinc-800/80 pt-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Weekly</h4>
        {weekly.strategyFocus ? (
          <p className="text-sm text-zinc-200">
            <span className="text-zinc-500" aria-hidden>
              📅{" "}
            </span>
            {weekly.strategyFocus}
          </p>
        ) : null}
        {weekly.priorities.length > 0 ? (
          <div>
            <p className="text-[11px] text-zinc-500">Priorities</p>
            <ul className="mt-1 list-inside list-disc text-sm text-zinc-300">
              {weekly.priorities.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {weekly.experiments.length > 0 ? (
          <div>
            <p className="text-[11px] text-zinc-500">Experiments</p>
            <ul className="mt-1 list-inside list-disc text-sm text-zinc-300">
              {weekly.experiments.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {weekly.roadmapFocus.length > 0 ? (
          <div>
            <p className="text-[11px] text-zinc-500">Roadmap focus</p>
            <ul className="mt-1 list-inside list-disc text-sm text-zinc-300">
              {weekly.roadmapFocus.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {weekly.warnings.length > 0 ? (
          <ul className="list-inside list-disc text-xs text-amber-100/85">
            {weekly.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
