"use client";

import type { CalibrationMetrics } from "@/modules/model-validation/domain/validation.types";

function pct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(100 * n).toFixed(1)}%`;
}

export function CalibrationMetricsCards({ metrics }: { metrics: CalibrationMetrics }) {
  const cards = [
    { label: "Total agreement", sub: "all 3 dims labeled & agree", value: pct(metrics.totalAgreementRate), tone: "text-emerald-300" },
    { label: "Trust agreement", sub: "bucket vs human", value: pct(metrics.trustAgreementRate), tone: "text-zinc-100" },
    { label: "Deal agreement", sub: "recommendation vs human", value: pct(metrics.dealAgreementRate), tone: "text-zinc-100" },
    { label: "Risk agreement", sub: "fraud score vs human", value: pct(metrics.riskAgreementRate), tone: "text-zinc-100" },
    { label: "FP high trust", sub: "strong/verified vs human low", value: pct(metrics.falsePositiveHighTrustRate), tone: "text-amber-300" },
    { label: "FP strong opportunity", sub: "pred strong vs human negative", value: pct(metrics.falsePositiveStrongOpportunityRate), tone: "text-amber-300" },
    { label: "Manual review rate", sub: "needsManualReview", value: pct(metrics.manualReviewRate), tone: "text-red-300/90" },
    {
      label: "Avg fairness",
      sub: "1–5 rating",
      value: metrics.averageFairnessRating != null ? metrics.averageFairnessRating.toFixed(2) : "—",
      tone: "text-zinc-200",
    },
    {
      label: "Low-conf / disagreement",
      sub: "share of disagreements with low confidence",
      value: pct(metrics.lowConfidenceDisagreementConcentration),
      tone: "text-sky-300/90",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">{c.label}</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${c.tone}`}>{c.value}</p>
          <p className="mt-0.5 text-[11px] text-zinc-600">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
