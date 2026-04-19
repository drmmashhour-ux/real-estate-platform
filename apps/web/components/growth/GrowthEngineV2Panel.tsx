"use client";

import * as React from "react";
import type { GrowthEngineV2Summary, GrowthHealthBand } from "@/modules/growth/v2/growth-engine-v2.types";

function bandStyle(b: GrowthHealthBand): string {
  if (b === "strong") return "border-emerald-500/40 bg-emerald-950/35 text-emerald-100";
  if (b === "ok") return "border-sky-500/35 bg-sky-950/25 text-sky-100";
  if (b === "watch") return "border-amber-500/35 bg-amber-950/25 text-amber-100";
  return "border-white/15 bg-white/5 text-slate-400";
}

export function GrowthEngineV2Panel() {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [data, setData] = React.useState<GrowthEngineV2Summary | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const res = await fetch("/api/admin/growth-engine-v2", { credentials: "same-origin" });
        const json = (await res.json()) as GrowthEngineV2Summary & { error?: string };
        if (res.status === 404) {
          if (!cancelled) setErr("Growth Engine V2 is disabled (feature flag).");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setErr(json.error ?? "Failed to load");
          return;
        }
        if (!cancelled) setData(json as GrowthEngineV2Summary);
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
    return <p className="text-sm text-slate-400">Loading Growth Engine V2 snapshot…</p>;
  }
  if (err || !data) {
    return <p className="text-sm text-slate-400">{err ?? "No data"}</p>;
  }

  const strip: { label: string; v: GrowthHealthBand }[] = [
    { label: "Traffic", v: data.trafficHealth },
    { label: "Conversion", v: data.conversionHealth },
    { label: "Revenue", v: data.revenueHealth },
    { label: "Brokers", v: data.brokerHealth },
    { label: "BNHub", v: data.bnhubHealth },
    { label: "Platform", v: data.platformHealth },
  ];

  return (
    <div className="space-y-8 text-white">
      <p className="text-xs text-slate-500">
        Read-only signals — deterministic heuristics; no autopilot execution or outbound sends from this panel.
      </p>

      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {strip.map(({ label, v }) => (
          <div key={label} className={`rounded-xl border px-3 py-2 ${bandStyle(v)}`}>
            <p className="text-[10px] uppercase tracking-wide opacity-80">{label}</p>
            <p className="mt-1 text-sm font-semibold capitalize">{v.replace(/_/g, " ")}</p>
          </div>
        ))}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-white">Top opportunities</h3>
        <ul className="mt-3 space-y-3">
          {data.topOpportunities.length === 0 ? (
            <li className="text-xs text-slate-500">None surfaced for this snapshot.</li>
          ) : (
            data.topOpportunities.slice(0, 6).map((o) => (
              <li key={o.id} className="rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-xs">
                <p className="font-semibold text-slate-100">{o.title}</p>
                <p className="mt-1 text-slate-400">{o.description}</p>
                <p className="mt-2 text-emerald-100/90">
                  <span className="text-emerald-300">Next:</span> {o.recommendedAction}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-white">Top risks</h3>
        <ul className="mt-3 space-y-3">
          {data.topRisks.length === 0 ? (
            <li className="text-xs text-slate-500">None surfaced for this snapshot.</li>
          ) : (
            data.topRisks.slice(0, 6).map((r) => (
              <li key={r.id} className="rounded-lg border border-rose-500/20 bg-rose-950/15 px-4 py-3 text-xs">
                <p className="font-semibold text-rose-100">{r.title}</p>
                <p className="mt-1 text-slate-400">{r.description}</p>
                <p className="mt-2 text-slate-300">
                  <span className="text-slate-500">Response:</span> {r.recommendedResponse}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h3 className="text-sm font-semibold text-white">Top actions — today</h3>
          <ul className="mt-3 space-y-2">
            {data.topActions.map((a) => (
              <li key={a.id} className="rounded-lg border border-emerald-500/25 bg-emerald-950/15 px-3 py-2 text-xs">
                <span className="font-medium text-emerald-100">{a.title}</span>
                <span className="ml-2 text-[10px] uppercase text-slate-500">{a.ownerArea}</span>
                <p className="mt-1 text-slate-400">{a.description}</p>
                <p className="mt-1 text-[10px] text-slate-600">Surface hint: {a.targetSurface}</p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-sm font-semibold text-white">This week</h3>
          <ul className="mt-3 space-y-2">
            {data.weeklyActions.map((a) => (
              <li key={a.id} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs">
                <span className="font-medium text-slate-100">{a.title}</span>
                <span className="ml-2 text-[10px] uppercase text-slate-500">{a.ownerArea}</span>
                <p className="mt-1 text-slate-400">{a.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {data.dataQualityNotes.length > 0 ? (
        <section className="rounded-lg border border-dashed border-white/15 p-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-400">Data quality</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {data.dataQualityNotes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-[10px] text-slate-600">Generated {new Date(data.generatedAt).toLocaleString()}</p>
    </div>
  );
}
