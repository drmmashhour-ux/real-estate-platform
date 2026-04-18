"use client";

import { useEffect, useState } from "react";
import type { CompanyForecastPayload } from "@/modules/company-forecasting/company-forecasting.types";

export function StrategyScenarioPanel() {
  const [data, setData] = useState<CompanyForecastPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const res = await fetch("/api/owner/forecasting?horizonDays=30&window=30d", { credentials: "include" });
        if (!res.ok) {
          setErr("Estimations indisponibles");
          return;
        }
        const j = (await res.json()) as { forecast?: CompanyForecastPayload };
        if (!c) setData(j.forecast ?? null);
      } catch {
        if (!c) setErr("Erreur réseau");
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  if (err) return <p className="text-xs text-zinc-500">{err}</p>;
  if (!data) return <p className="text-xs text-zinc-500">Chargement des scénarios…</p>;

  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/50 p-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Scénarios (estimations)</h3>
      <p className="mt-2 text-[11px] text-amber-200/70">ESTIMATION — {data.disclaimer}</p>
      <ul className="mt-4 space-y-3 text-sm">
        {data.metrics.map((m) => (
          <li key={m.metric} className="border-b border-amber-950/30 pb-2">
            <p className="font-mono text-xs text-amber-100/90">{m.metric}</p>
            <p className="text-xs text-zinc-400">
              Base {m.baselineEstimate ?? "—"} · haut {m.optimisticEstimate ?? "—"} · prudent {m.conservativeEstimate ?? "—"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
