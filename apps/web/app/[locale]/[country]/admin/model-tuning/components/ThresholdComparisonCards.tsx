"use client";

import type { CalibrationMetrics } from "@/modules/model-validation/domain/validation.types";
import { compareTuningMetrics } from "@/modules/model-tuning/application/compareTuningResults";

function pct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(100 * n).toFixed(1)}%`;
}

function fmtMetric(key: keyof CalibrationMetrics, v: number | null): string {
  if (v == null || Number.isNaN(v)) return "—";
  if (key === "averageFairnessRating") return v.toFixed(2);
  return pct(v);
}

export function ThresholdComparisonCards({
  before,
  after,
}: {
  before: CalibrationMetrics;
  after: CalibrationMetrics;
}) {
  const deltas = compareTuningMetrics(before, after);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {deltas.map((d) => (
        <div key={d.key} className="rounded-lg border border-zinc-800 bg-black/30 p-3">
          <p className="text-[10px] uppercase text-zinc-500">{d.key}</p>
          <p className="mt-1 text-sm text-zinc-500">
            Before <span className="text-zinc-300">{fmtMetric(d.key, d.before)}</span>
          </p>
          <p className="text-sm text-zinc-500">
            After <span className="text-emerald-300">{fmtMetric(d.key, d.after)}</span>
          </p>
          {d.delta != null && d.key !== "averageFairnessRating" ? (
            <p className={`mt-1 text-xs ${d.delta >= 0 ? "text-emerald-400/90" : "text-red-400/90"}`}>
              Δ {(100 * d.delta).toFixed(2)} pp
            </p>
          ) : d.delta != null && d.key === "averageFairnessRating" ? (
            <p className={`mt-1 text-xs ${d.delta >= 0 ? "text-emerald-400/90" : "text-red-400/90"}`}>Δ {d.delta.toFixed(3)}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
