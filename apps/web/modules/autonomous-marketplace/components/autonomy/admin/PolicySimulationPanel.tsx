"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PolicySimulationComparisonReport } from "@/modules/autonomous-marketplace/simulation/policy-simulation.types";

type ApiOk = {
  ok: true;
  report: PolicySimulationComparisonReport;
};

function pct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function money(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

function DeltaCell({
  value,
  invert,
  mode = "rate",
}: {
  value: number;
  /** When true, negative change is good (e.g. lower FN rate vs baseline). */
  invert?: boolean;
  mode?: "rate" | "money";
}) {
  const good = invert ? value <= 0 : value >= 0;
  const arrow = value === 0 ? "→" : value > 0 ? "↑" : "↓";
  const tone = value === 0 ? "text-slate-400" : good ? "text-emerald-300" : "text-amber-200";
  const formatted =
    mode === "money" ?
      money(Math.abs(value))
    : Math.abs(value) < 1e-9 ? "0"
    : value.toFixed(3);
  return (
    <span className={`font-mono text-xs ${tone}`}>
      {arrow} {formatted}
    </span>
  );
}

export function PolicySimulationPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<PolicySimulationComparisonReport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/autonomy/policy-simulation", { credentials: "same-origin" });
      const json = (await res.json()) as ApiOk | { ok?: boolean; error?: string };
      if (!res.ok || json.ok !== true || !("report" in json)) {
        const msg =
          typeof json === "object" && json && "error" in json && typeof json.error === "string"
            ? json.error
            : "Could not load policy simulation.";
        setError(msg);
        setReport(null);
        return;
      }
      setReport(json.report);
    } catch {
      setError("Could not load policy simulation.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const narrative = useMemo(() => {
    if (!report?.baseline) return "";
    const bestId = report.bestScenarioId;
    const best = report.scenarios.find((s) => s.configId === bestId);
    const b = report.baseline;
    return (
      `Compared ${report.scenarios.length} scenarios against baseline "${b.configId}". ` +
      (best ?
        `Best composite (${bestId}): FN rate ${pct(best.falseNegativeRate)}, protected ${money(best.protectedRevenue)}. `
      : "") +
      `Sandbox only — does not change production gates.`
    );
  }, [report]);

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-800" />
        <div className="h-32 animate-pulse rounded-xl border border-slate-800 bg-slate-900/60" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-rose-300">{error}</p>;
  }

  if (!report) return null;

  const rows = [{ r: report.baseline, isBaseline: true }, ...report.scenarios.map((r) => ({ r, isBaseline: false }))];

  return (
    <div className="space-y-4 text-sm text-slate-200">
      {report.bestScenarioId ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-950/25 px-3 py-2 text-xs text-emerald-100">
          Best scenario (lowest leaked − FP rate):{" "}
          <span className="font-semibold text-emerald-50">{report.bestScenarioId}</span>
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-semibold">Scenario</th>
              <th className="px-3 py-2 font-semibold">FP rate</th>
              <th className="px-3 py-2 font-semibold">FN rate</th>
              <th className="px-3 py-2 font-semibold">Protected</th>
              <th className="px-3 py-2 font-semibold">Leaked</th>
              <th className="px-3 py-2 font-semibold">Δ FN vs baseline</th>
              <th className="px-3 py-2 font-semibold">Δ Protected</th>
              <th className="px-3 py-2 font-semibold">Δ Leaked</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, isBaseline }) => {
              const best = !isBaseline && r.configId === report.bestScenarioId;
              return (
                <tr
                  key={r.configId + (isBaseline ? "-base" : "")}
                  className={`border-b border-slate-800/80 ${best ? "bg-emerald-950/30" : "bg-transparent"}`}
                >
                  <td className="px-3 py-2 font-medium text-slate-100">
                    {r.configId}
                    {isBaseline ? <span className="ml-2 text-[10px] text-slate-500">(baseline)</span> : null}
                    {best ? <span className="ml-2 text-[10px] text-emerald-400">★ best</span> : null}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-300">{pct(r.falsePositiveRate)}</td>
                  <td className="px-3 py-2 font-mono text-slate-300">{pct(r.falseNegativeRate)}</td>
                  <td className="px-3 py-2 font-mono text-slate-300">{money(r.protectedRevenue)}</td>
                  <td className="px-3 py-2 font-mono text-slate-300">{money(r.leakedRevenue)}</td>
                  <td className="px-3 py-2">
                    {isBaseline ? (
                      <span className="text-slate-600">—</span>
                    ) : (
                      <span className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] text-slate-500">↓ FN</span>
                        <DeltaCell value={r.delta.falseNegativeRate} invert />
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isBaseline ? (
                      <span className="text-slate-600">—</span>
                    ) : (
                      <span className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] text-slate-500">↑ protected</span>
                        <DeltaCell value={r.delta.protectedRevenue} mode="money" />
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isBaseline ? (
                      <span className="text-slate-600">—</span>
                    ) : (
                      <DeltaCell value={r.delta.leakedRevenue} invert mode="money" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">{narrative}</p>
      <p className="text-[11px] text-slate-600">
        Δ FN: negative is better (fewer harmful allows). Δ Protected: positive is better. Δ Leaked: negative is better.
      </p>
    </div>
  );
}
