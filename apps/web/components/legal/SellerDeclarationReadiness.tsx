"use client";

import Link from "next/link";

type Props = {
  completionPercent: number;
  blockingIssues: string[];
  readinessLabel: string;
  fixHref: string;
  /** Optional TrustGraph engine metrics (safe — rule codes only when exposed here). */
  contradictionCount?: number;
  engineFailedRuleCount?: number;
};

export function SellerDeclarationReadiness({
  completionPercent,
  blockingIssues,
  readinessLabel,
  fixHref,
  contradictionCount = 0,
  engineFailedRuleCount,
}: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Declaration readiness</span>
        <span className="text-sm font-semibold text-white">{Math.round(completionPercent)}%</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">{readinessLabel}</p>
      {contradictionCount > 0 ? (
        <p className="mt-1 text-xs text-rose-200/90">{contradictionCount} potential contradiction(s) to review</p>
      ) : null}
      {engineFailedRuleCount != null && engineFailedRuleCount > 0 ? (
        <p className="mt-1 text-xs text-amber-200/85">{engineFailedRuleCount} verification check(s) need attention</p>
      ) : null}
      {blockingIssues.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-xs text-amber-200/90">
          {blockingIssues.slice(0, 5).map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}
      <Link href={fixHref} className="mt-2 inline-block text-xs font-medium text-[#C9A646] hover:underline">
        Open declaration
      </Link>
    </div>
  );
}
