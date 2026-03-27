"use client";

type ValuationSummaryCardProps = {
  valuationType: string;
  summary: string;
  confidenceScore: number;
  confidenceLabel: string;
  disclaimer?: string;
  children?: React.ReactNode;
};

export function ValuationSummaryCard({
  valuationType,
  summary,
  confidenceScore,
  confidenceLabel,
  disclaimer,
  children,
}: ValuationSummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {valuationType.replace(/_/g, " ")}
        </span>
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${
            confidenceLabel === "high"
              ? "bg-emerald-500/20 text-emerald-400"
              : confidenceLabel === "medium"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-slate-500/20 text-slate-400"
          }`}
        >
          {confidenceLabel} ({confidenceScore}%)
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-200">{summary}</p>
      {disclaimer && (
        <p className="mt-2 text-xs text-slate-500">{disclaimer}</p>
      )}
      {children}
    </div>
  );
}
