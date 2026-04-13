"use client";

import type { ValidationMetricsDelta } from "@/modules/model-validation/domain/validation.types";

const ORDER: (keyof ValidationMetricsDelta)[] = [
  "trustAgreementRate",
  "dealAgreementRate",
  "riskAgreementRate",
  "falsePositiveHighTrustRate",
  "falsePositiveStrongOpportunityRate",
  "averageFairnessRating",
  "manualReviewRate",
  "lowConfidenceDisagreementConcentration",
  "totalAgreementRate",
];

const LABEL: Record<keyof ValidationMetricsDelta, string> = {
  trustAgreementRate: "Trust agreement",
  dealAgreementRate: "Deal agreement",
  riskAgreementRate: "Risk agreement",
  falsePositiveHighTrustRate: "FP high trust",
  falsePositiveStrongOpportunityRate: "FP strong opportunity",
  averageFairnessRating: "Avg fairness",
  manualReviewRate: "Manual review rate",
  lowConfidenceDisagreementConcentration: "Low-conf / disagreement",
  totalAgreementRate: "Total agreement",
};

function tone(d: string): string {
  if (d === "improved") return "text-emerald-400";
  if (d === "worsened") return "text-red-400";
  return "text-zinc-500";
}

export function ValidationDeltaTable({ delta }: { delta: ValidationMetricsDelta }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="min-w-full text-left text-xs">
        <thead className="border-b border-zinc-800 bg-zinc-950/80 text-[10px] uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2">Metric</th>
            <th className="px-3 py-2">Base</th>
            <th className="px-3 py-2">New</th>
            <th className="px-3 py-2">Δ</th>
            <th className="px-3 py-2">Verdict</th>
          </tr>
        </thead>
        <tbody>
          {ORDER.map((k) => {
            const e = delta[k];
            return (
              <tr key={k} className="border-b border-zinc-800/80">
                <td className="px-3 py-2 text-zinc-400">{LABEL[k]}</td>
                <td className="px-3 py-2 font-mono tabular-nums text-zinc-300">
                  {e.base != null ? e.base.toFixed(4) : "—"}
                </td>
                <td className="px-3 py-2 font-mono tabular-nums text-zinc-300">
                  {e.comparison != null ? e.comparison.toFixed(4) : "—"}
                </td>
                <td className="px-3 py-2 font-mono tabular-nums text-zinc-200">
                  {e.delta != null ? e.delta.toFixed(4) : "—"}
                </td>
                <td className={`px-3 py-2 font-medium capitalize ${tone(e.direction)}`}>{e.direction}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
