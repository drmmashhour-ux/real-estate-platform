"use client";

import { formatCurrencyCAD } from "@/lib/investment/format";

export type PreApprovalSnapshot = {
  estimatedApprovalAmount: number;
  estimatedMonthlyPayment: number;
  approvalConfidence: string;
};

function cardToneClass(confidence: string): string {
  const c = confidence.toLowerCase();
  if (c === "high") {
    return "border-emerald-500/55 bg-emerald-950/45 text-emerald-50 shadow-[0_0_24px_rgba(16,185,129,0.12)]";
  }
  if (c === "medium") {
    return "border-amber-500/50 bg-amber-950/40 text-amber-50 shadow-[0_0_24px_rgba(245,158,11,0.1)]";
  }
  return "border-red-500/45 bg-red-950/35 text-red-50 shadow-[0_0_24px_rgba(239,68,68,0.1)]";
}

function confidenceLabel(confidence: string): string {
  const c = confidence.toLowerCase();
  if (c === "high") return "High";
  if (c === "medium") return "Medium";
  return "Low";
}

export function PreApprovalEstimateCard({
  estimate,
  compact = false,
  showDisclaimer = true,
}: {
  estimate: PreApprovalSnapshot;
  compact?: boolean;
  /** Hide on broker / internal views where the disclaimer is redundant. */
  showDisclaimer?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 ${compact ? "text-sm" : ""} ${cardToneClass(estimate.approvalConfidence)}`}
      role="region"
      aria-label="Pre-approval estimate"
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-90">Pre-approval estimate</p>
      <dl className={`mt-3 space-y-2 ${compact ? "text-sm" : ""}`}>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="opacity-80">Estimated approval</dt>
          <dd className="font-mono font-bold tabular-nums">
            {formatCurrencyCAD(estimate.estimatedApprovalAmount)}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="opacity-80">Estimated monthly payment</dt>
          <dd className="font-mono font-semibold tabular-nums">
            {formatCurrencyCAD(estimate.estimatedMonthlyPayment)}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="opacity-80">Confidence</dt>
          <dd className="font-semibold">{confidenceLabel(estimate.approvalConfidence)}</dd>
        </div>
      </dl>
      {showDisclaimer ? (
        <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-relaxed opacity-90">
          This is an estimate only. A mortgage broker will confirm your eligibility.
        </p>
      ) : null}
    </div>
  );
}
