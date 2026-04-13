"use client";

import type { CalibrationMetrics } from "@/modules/model-validation/domain/validation.types";

function pct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(100 * n).toFixed(1)}%`;
}

function fair(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(2);
}

type Props = {
  baseline?: CalibrationMetrics | null;
  tunedSame?: CalibrationMetrics | null;
  tunedFresh?: CalibrationMetrics | null;
};

/** Side-by-side aggregate metrics (internal calibration — not public). */
export function ValidationRunComparisonCards({ baseline, tunedSame, tunedFresh }: Props) {
  const rows: { label: string; get: (m: CalibrationMetrics) => string }[] = [
    { label: "Trust agreement", get: (m) => pct(m.trustAgreementRate) },
    { label: "Deal agreement", get: (m) => pct(m.dealAgreementRate) },
    { label: "Risk agreement", get: (m) => pct(m.riskAgreementRate) },
    { label: "FP high trust", get: (m) => pct(m.falsePositiveHighTrustRate) },
    { label: "FP strong opportunity", get: (m) => pct(m.falsePositiveStrongOpportunityRate) },
    { label: "Avg fairness", get: (m) => fair(m.averageFairnessRating) },
    { label: "Manual review rate", get: (m) => pct(m.manualReviewRate) },
    { label: "Low-conf / disagreement", get: (m) => pct(m.lowConfidenceDisagreementConcentration) },
  ];

  const cols = [
    { key: "baseline", label: "Baseline", m: baseline },
    { key: "same", label: "Tuned same 50", m: tunedSame },
    { key: "fresh", label: "Tuned fresh 50", m: tunedFresh },
  ].filter((c) => c.m != null);

  if (!cols.length) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="min-w-full text-left text-xs">
        <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[10px] uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2">Metric</th>
            {cols.map((c) => (
              <th key={c.key} className="px-3 py-2">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-zinc-800/80">
              <td className="px-3 py-2 text-zinc-400">{row.label}</td>
              {cols.map((c) => (
                <td key={c.key} className="px-3 py-2 font-mono tabular-nums text-zinc-200">
                  {row.get(c.m!)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
